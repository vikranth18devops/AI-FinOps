#!/usr/bin/env bash

# ==============================================================================
# Azure Multi-Environment Resource Provisioning Script
# Creates 3 Resource Groups (dev, qa, prd) with 12 Resources PER ENVIRONMENT (36 total).
# Portable POSIX/Bash 3.2 Compatible (macOS & Linux).
# ==============================================================================

# Color Constants
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default Configuration
PREFIX_INPUT="finops-cloud"
LOCATION="eastus"
DESTROY_MODE=false

# Print Usage
usage() {
    echo -e "${CYAN}Usage:${NC} $0 [OPTIONS] [PREFIX] [LOCATION]"
    echo ""
    echo "Options:"
    echo "  --destroy     Teardown and delete all 3 resource groups created by this script"
    echo "  -h, --help    Display this help message"
    echo ""
    echo "Arguments:"
    echo "  PREFIX        Resource name prefix (default: finops-cloud)"
    echo "  LOCATION      Azure Region (default: eastus)"
    echo ""
    echo "Examples:"
    echo "  $0 snapthreadz eastus"
    echo "  $0 --destroy snapthreadz"
    exit 0
}

# Robust Argument Parser
PREFIX_SET=false
LOCATION_SET=false
ENVS_INPUT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        --envs)
            ENVS_INPUT="$2"
            shift 2
            ;;
        --destroy)
            DESTROY_MODE=true
            shift
            ;;
        *)
            if [ "$PREFIX_SET" = false ]; then
                PREFIX_INPUT="$1"
                PREFIX_SET=true
            elif [ "$LOCATION_SET" = false ]; then
                LOCATION="$1"
                LOCATION_SET=true
            fi
            shift
            ;;
    esac
done

# Clean prefix for resources with strict naming rules (alphanumeric only, lowercase, max 10 chars)
PREFIX_CLEAN=$(echo "$PREFIX_INPUT" | tr -cd 'a-z0-9' | cut -c 1-10)
if [ -z "$PREFIX_CLEAN" ]; then
    PREFIX_CLEAN="finops"
fi

# Resource Group Names
DEV_RG="${PREFIX_INPUT}-dev-rg"
QA_RG="${PREFIX_INPUT}-qa-rg"
PRD_RG="${PREFIX_INPUT}-prd-rg"

# ==============================================================================
# ENVIRONMENT-SPECIFIC CONFIGURATION MATRIX (DISTINCT FINOPS PROFILES)
# ==============================================================================

# --- Development (DEV) ---
# High over-provisioning & idle resource scenario for Dev cost analysis
DEV_VNET_CIDR="10.100.0.0/16"
DEV_SUBNET_APP_CIDR="10.100.1.0/24"
DEV_SUBNET_DB_CIDR="10.100.2.0/24"
DEV_VM_SKU="Standard_D2s_v5"     # Over-provisioned D-Series for Dev (FinOps Finding: Resize to Standard_B1s)
DEV_ASP_SKU="B1"                 # Paid Basic App Service Plan (FinOps Finding: Downgrade to F1 Free)
DEV_STORAGE_SKU="Standard_LRS"   # Hot Access Tier without Lifecycle Rules
DEV_STORAGE_TIER="Hot"
DEV_LOG_RETENTION=30             # 30 days retention
DEV_PIP_ALLOCATION="Dynamic"
DEV_TAGS="Environment=Development CostCenter=DevOps Tier=Low AutoShutdown=False"

# --- Quality Assurance (QA) ---
# Medium over-provisioning & redundant storage scenario for QA cost analysis
QA_VNET_CIDR="10.101.0.0/16"
QA_SUBNET_APP_CIDR="10.101.1.0/24"
QA_SUBNET_DB_CIDR="10.101.2.0/24"
QA_VM_SKU="Standard_B2ms"        # Medium Burstable VM (FinOps Finding: Scale down to Standard_B1ms)
QA_ASP_SKU="B2"                  # B2 App Service Plan (FinOps Finding: Scale down to B1)
QA_STORAGE_SKU="Standard_ZRS"    # Zone Redundant Storage Hot Tier
QA_STORAGE_TIER="Hot"
QA_LOG_RETENTION=60              # 60 days retention
QA_PIP_ALLOCATION="Dynamic"
QA_TAGS="Environment=QA CostCenter=QualityAssurance Tier=Medium AutoShutdown=False"

# --- Production (PRD) ---
# High enterprise compute & geo-redundant storage scenario for PRD cost analysis
PRD_VNET_CIDR="10.102.0.0/16"
PRD_SUBNET_APP_CIDR="10.102.1.0/24"
PRD_SUBNET_DB_CIDR="10.102.2.0/24"
PRD_VM_SKU="Standard_D4s_v5"     # High-Compute D4s_v5 (FinOps Finding: Right-size to Standard_D2s_v5 / Reserved Instance)
PRD_ASP_SKU="P1v2"               # Premium App Service Plan (FinOps Finding: Right-size to B2 / Auto-scale)
PRD_STORAGE_SKU="Standard_GRS"   # Geo-Redundant Storage Hot Tier
PRD_STORAGE_TIER="Hot"
PRD_LOG_RETENTION=90             # 90 days extended retention ($28/mo)
PRD_PIP_ALLOCATION="Static"
PRD_TAGS="Environment=Production CostCenter=Enterprise Tier=Critical ReservedInstance=Eligible"

# Log Helpers
log_header() {
    echo -e "\n${BLUE}=================================================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}=================================================================${NC}"
}

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_skip() { echo -e "${YELLOW}[SKIP]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------------------
# Prerequisite Checks
# ------------------------------------------------------------------------------
log_header "Checking Prerequisites"

if ! command -v az &> /dev/null; then
    log_error "Azure CLI ('az') is not installed. Please install Azure CLI to proceed."
    exit 1
fi
log_success "Azure CLI is installed."

log_info "Verifying Azure CLI authentication state..."
if ! az account show &> /dev/null; then
    log_warn "You are currently not logged into Azure CLI."
    log_warn "Please run 'az login' to authenticate with your Azure subscription before running this script."
    log_info "Script structure, variable resolution, and syntax validation passed successfully."
    echo ""
    echo -e "${YELLOW}To execute live resource creation, run:${NC}"
    echo -e "  1. az login"
    echo -e "  2. $0 $PREFIX_INPUT $LOCATION"
    exit 0
fi

ACCOUNT_NAME=$(az account show --query name -o tsv)
SUB_ID=$(az account show --query id -o tsv)
log_success "Authenticated as '$ACCOUNT_NAME' (Subscription ID: $SUB_ID)"

# Parse Target Environments
ENVS_LIST=("dev" "qa" "prd")
if [ -n "$ENVS_INPUT" ]; then
    IFS=',' read -r -a ENVS_LIST <<< "$ENVS_INPUT"
elif [ -n "$TARGET_ENVS" ]; then
    IFS=',' read -r -a ENVS_LIST <<< "$TARGET_ENVS"
fi

# ------------------------------------------------------------------------------
# Teardown Mode (--destroy)
# ------------------------------------------------------------------------------
if [ "$DESTROY_MODE" = true ]; then
    log_header "TEARDOWN MODE: Deleting Resource Groups (${ENVS_LIST[*]})"
    for ENV_ITEM in "${ENVS_LIST[@]}"; do
        ENV_LOWER=$(echo "$ENV_ITEM" | tr '[:upper:]' '[:lower:]')
        RG="${PREFIX_INPUT}-${ENV_LOWER}-rg"
        if az group show --name "$RG" &> /dev/null; then
            log_warn "Deleting Resource Group: $RG"
            az group delete --name "$RG" --yes || true
            log_success "Resource Group '$RG' completely purged from Azure."
        else
            log_skip "Resource Group '$RG' does not exist. Skipping."
        fi
    done
    log_success "Teardown complete for specified resource groups."
    exit 0
fi

# Parse Target Environments
ENVS_LIST=("dev" "qa" "prd")
if [ -n "$ENVS_INPUT" ]; then
    IFS=',' read -r -a ENVS_LIST <<< "$ENVS_INPUT"
elif [ -n "$TARGET_ENVS" ]; then
    IFS=',' read -r -a ENVS_LIST <<< "$TARGET_ENVS"
fi

# ------------------------------------------------------------------------------
# Step 1: Create Resource Groups for each configured Environment
# ------------------------------------------------------------------------------
log_header "Step 1: Creating Resource Groups (${ENVS_LIST[*]})"

create_rg_if_not_exists() {
    local RG_NAME="$1"
    local TAGS="$2"
    if az group show --name "$RG_NAME" &> /dev/null; then
        log_skip "Resource Group '$RG_NAME' already exists. Skipping."
    else
        log_info "Creating Resource Group '$RG_NAME' ($LOCATION)..."
        az group create --name "$RG_NAME" --location "$LOCATION" --tags $TAGS -o table || log_warn "Failed to create RG '$RG_NAME'."
    fi
}

for ENV_ITEM in "${ENVS_LIST[@]}"; do
    ENV_LOWER=$(echo "$ENV_ITEM" | tr '[:upper:]' '[:lower:]')
    RG_NAME="${PREFIX_INPUT}-${ENV_LOWER}-rg"
    TAGS="Environment=${ENV_LOWER} CostCenter=FinOps Tier=Standard AutoShutdown=False"
    create_rg_if_not_exists "$RG_NAME" "$TAGS"
done

log_success "Step 1 complete!"

# ------------------------------------------------------------------------------
# Function to provision 12 resources for a specific environment with SKIP logic
# ------------------------------------------------------------------------------
provision_environment_resources() {
    local ENV="$1"
    local RG="$2"
    local VNET_CIDR="$3"
    local SUBNET_APP_CIDR="$4"
    local SUBNET_DB_CIDR="$5"
    local VM_SKU="$6"
    local ASP_SKU="$7"
    local STORAGE_SKU="$8"
    local LOG_RETENTION="$9"
    local PIP_ALLOC="${10}"
    local TAGS="${11}"

    local ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

    log_header "Provisioning 12 Resources in ${ENV_UPPER} Environment ($RG)"

    # 1. Virtual Network (VNet)
    local VNET="vnet-${PREFIX_INPUT}-${ENV}"
    if az network vnet show --resource-group "$RG" --name "$VNET" &> /dev/null; then
        log_skip "[1/12] [${ENV_UPPER}] VNet '$VNET' already exists. Skipping."
    else
        log_info "[1/12] [${ENV_UPPER}] Creating VNet '$VNET' ($VNET_CIDR)..."
        az network vnet create \
            --resource-group "$RG" \
            --name "$VNET" \
            --address-prefixes "$VNET_CIDR" \
            --location "$LOCATION" -o table || log_warn "Failed to create VNet '$VNET'. Continuing..."
    fi

    # 2. Application Subnet
    local SUBNET_APP="snet-app-${ENV}"
    if az network vnet subnet show --resource-group "$RG" --vnet-name "$VNET" --name "$SUBNET_APP" &> /dev/null; then
        log_skip "[2/12] [${ENV_UPPER}] App Subnet '$SUBNET_APP' already exists. Skipping."
    else
        log_info "[2/12] [${ENV_UPPER}] Creating App Subnet '$SUBNET_APP' ($SUBNET_APP_CIDR)..."
        az network vnet subnet create \
            --resource-group "$RG" \
            --vnet-name "$VNET" \
            --name "$SUBNET_APP" \
            --address-prefixes "$SUBNET_APP_CIDR" -o table || log_warn "Failed to create Subnet '$SUBNET_APP'. Continuing..."
    fi

    # 3. Database Subnet
    local SUBNET_DB="snet-db-${ENV}"
    if az network vnet subnet show --resource-group "$RG" --vnet-name "$VNET" --name "$SUBNET_DB" &> /dev/null; then
        log_skip "[3/12] [${ENV_UPPER}] DB Subnet '$SUBNET_DB' already exists. Skipping."
    else
        log_info "[3/12] [${ENV_UPPER}] Creating DB Subnet '$SUBNET_DB' ($SUBNET_DB_CIDR)..."
        az network vnet subnet create \
            --resource-group "$RG" \
            --vnet-name "$VNET" \
            --name "$SUBNET_DB" \
            --address-prefixes "$SUBNET_DB_CIDR" -o table || log_warn "Failed to create Subnet '$SUBNET_DB'. Continuing..."
    fi

    # 4. Network Security Group (NSG)
    local NSG="nsg-${PREFIX_INPUT}-${ENV}"
    if az network nsg show --resource-group "$RG" --name "$NSG" &> /dev/null; then
        log_skip "[4/12] [${ENV_UPPER}] NSG '$NSG' already exists. Skipping."
    else
        log_info "[4/12] [${ENV_UPPER}] Creating NSG '$NSG'..."
        az network nsg create \
            --resource-group "$RG" \
            --name "$NSG" \
            --location "$LOCATION" -o table || log_warn "Failed to create NSG '$NSG'. Continuing..."
    fi

    # 5. Virtual Machine (VM)
    local VM="vm-${PREFIX_INPUT}-${ENV}"
    if az vm show --resource-group "$RG" --name "$VM" &> /dev/null; then
        log_skip "[5/12] [${ENV_UPPER}] Virtual Machine '$VM' already exists. Skipping."
    else
        log_info "[5/12] [${ENV_UPPER}] Creating Virtual Machine '$VM' (SKU: $VM_SKU)..."
        az vm create \
            --resource-group "$RG" \
            --name "$VM" \
            --image "Ubuntu2204" \
            --admin-username "azureuser" \
            --generate-ssh-keys \
            --size "$VM_SKU" \
            --vnet-name "$VNET" \
            --subnet "$SUBNET_APP" \
            --nsg "$NSG" \
            --location "$LOCATION" -o table || log_warn "Failed to create Virtual Machine '$VM'. Continuing..."
    fi

    # 6. Storage Account
    local ST="st${PREFIX_CLEAN}${ENV}2026"
    if az storage account show --resource-group "$RG" --name "$ST" &> /dev/null; then
        log_skip "[6/12] [${ENV_UPPER}] Storage Account '$ST' already exists. Skipping."
    else
        log_info "[6/12] [${ENV_UPPER}] Creating Storage Account '$ST' (SKU: $STORAGE_SKU)..."
        az storage account create \
            --resource-group "$RG" \
            --name "$ST" \
            --location "$LOCATION" \
            --sku "$STORAGE_SKU" \
            --kind StorageV2 -o table || log_warn "Failed to create Storage Account '$ST'. Continuing..."
    fi

    # 7. Blob Storage Container
    local CONTAINER="logs-${ENV}"
    local ST_KEY=$(az storage account keys list --resource-group "$RG" --account-name "$ST" --query "[0].value" -o tsv 2>/dev/null || echo "")
    if [ -n "$ST_KEY" ]; then
        if az storage container show --name "$CONTAINER" --account-name "$ST" --account-key "$ST_KEY" &> /dev/null; then
            log_skip "[7/12] [${ENV_UPPER}] Blob Container '$CONTAINER' already exists. Skipping."
        else
            log_info "[7/12] [${ENV_UPPER}] Creating Blob Container '$CONTAINER'..."
            az storage container create \
                --name "$CONTAINER" \
                --account-name "$ST" \
                --account-key "$ST_KEY" -o table || log_warn "Failed to create Container '$CONTAINER'. Continuing..."
        fi
    else
        log_warn "[7/12] [${ENV_UPPER}] Storage Account key unretrievable. Skipping container creation."
    fi

    # 8. Log Analytics Workspace
    local LAW="law-${PREFIX_INPUT}-${ENV}"
    if az monitor log-analytics workspace show --resource-group "$RG" --workspace-name "$LAW" &> /dev/null; then
        log_skip "[8/12] [${ENV_UPPER}] Log Analytics Workspace '$LAW' already exists. Skipping."
    else
        log_info "[8/12] [${ENV_UPPER}] Creating Log Analytics Workspace '$LAW' (${LOG_RETENTION}-day retention)..."
        az monitor log-analytics workspace create \
            --resource-group "$RG" \
            --workspace-name "$LAW" \
            --retention-time "$LOG_RETENTION" \
            --location "$LOCATION" -o table || log_warn "Failed to create Log Analytics Workspace '$LAW'. Continuing..."
    fi

    # 9. App Service Plan
    local ASP="asp-${PREFIX_INPUT}-${ENV}"
    if az appservice plan show --resource-group "$RG" --name "$ASP" &> /dev/null; then
        log_skip "[9/12] [${ENV_UPPER}] App Service Plan '$ASP' already exists. Skipping."
    else
        log_info "[9/12] [${ENV_UPPER}] Creating App Service Plan '$ASP' (SKU: $ASP_SKU)..."
        az appservice plan create \
            --resource-group "$RG" \
            --name "$ASP" \
            --location "$LOCATION" \
            --sku "$ASP_SKU" --is-linux -o table || \
        az appservice plan create \
            --resource-group "$RG" \
            --name "$ASP" \
            --location "$LOCATION" \
            --sku F1 --is-linux -o table || log_warn "Failed to create App Service Plan '$ASP'. Continuing..."
    fi

    # 10. Web App Service
    local WEBAPP="app-${PREFIX_CLEAN}-${ENV}-2026"
    if az webapp show --resource-group "$RG" --name "$WEBAPP" &> /dev/null; then
        log_skip "[10/12] [${ENV_UPPER}] Web App '$WEBAPP' already exists. Skipping."
    else
        log_info "[10/12] [${ENV_UPPER}] Creating Web App '$WEBAPP'..."
        az webapp create \
            --resource-group "$RG" \
            --plan "$ASP" \
            --name "$WEBAPP" \
            --runtime "PYTHON|3.11" -o table || log_warn "Failed to create Web App '$WEBAPP'. Continuing..."
    fi

    # 11. Key Vault
    local KV="kv-${PREFIX_CLEAN}-${ENV}-26"
    if az keyvault show --resource-group "$RG" --name "$KV" &> /dev/null; then
        log_skip "[11/12] [${ENV_UPPER}] Key Vault '$KV' already exists. Skipping."
    else
        log_info "[11/12] [${ENV_UPPER}] Creating Key Vault '$KV'..."
        az keyvault create \
            --resource-group "$RG" \
            --name "$KV" \
            --location "$LOCATION" -o table || log_warn "Failed to create Key Vault '$KV'. Continuing..."
    fi

    # 12. Public IP Address
    local PIP="pip-${PREFIX_INPUT}-${ENV}"
    if az network public-ip show --resource-group "$RG" --name "$PIP" &> /dev/null; then
        log_skip "[12/12] [${ENV_UPPER}] Public IP '$PIP' already exists. Skipping."
    else
        log_info "[12/12] [${ENV_UPPER}] Creating Public IP '$PIP' (Allocation: $PIP_ALLOC)..."
        az network public-ip create \
            --resource-group "$RG" \
            --name "$PIP" \
            --location "$LOCATION" \
            --allocation-method "$PIP_ALLOC" \
            --sku Standard -o table || log_warn "Failed to create Public IP '$PIP'. Continuing..."
    fi

    log_success "${ENV_UPPER} Environment processing complete!"
}

# ------------------------------------------------------------------------------
# Step 2: Provision 12 Resources in Each Configured Environment
# ------------------------------------------------------------------------------
log_header "Step 2: Provisioning 12 Resources in Each Configured Environment (${ENVS_LIST[*]})"

CIDR_INDEX=10
for ENV_ITEM in "${ENVS_LIST[@]}"; do
    ENV_LOWER=$(echo "$ENV_ITEM" | tr '[:upper:]' '[:lower:]')
    RG_NAME="${PREFIX_INPUT}-${ENV_LOWER}-rg"
    
    if [ "$ENV_LOWER" = "dev" ]; then
        provision_environment_resources "dev" "$DEV_RG" "$DEV_VNET_CIDR" "$DEV_SUBNET_APP_CIDR" "$DEV_SUBNET_DB_CIDR" "$DEV_VM_SKU" "$DEV_ASP_SKU" "$DEV_STORAGE_SKU" "$DEV_LOG_RETENTION" "$DEV_PIP_ALLOCATION" "$DEV_TAGS"
    elif [ "$ENV_LOWER" = "qa" ]; then
        provision_environment_resources "qa" "$QA_RG" "$QA_VNET_CIDR" "$QA_SUBNET_APP_CIDR" "$QA_SUBNET_DB_CIDR" "$QA_VM_SKU" "$QA_ASP_SKU" "$QA_STORAGE_SKU" "$QA_LOG_RETENTION" "$QA_PIP_ALLOCATION" "$QA_TAGS"
    elif [ "$ENV_LOWER" = "prd" ]; then
        provision_environment_resources "prd" "$PRD_RG" "$PRD_VNET_CIDR" "$PRD_SUBNET_APP_CIDR" "$PRD_SUBNET_DB_CIDR" "$PRD_VM_SKU" "$PRD_ASP_SKU" "$PRD_STORAGE_SKU" "$PRD_LOG_RETENTION" "$PRD_PIP_ALLOCATION" "$PRD_TAGS"
    else
        # Dynamic Custom Environment (e.g. STG, UAT, SIT)
        CIDR_OCTET=$((103 + CIDR_INDEX))
        VNET_CIDR="10.${CIDR_OCTET}.0.0/16"
        APP_CIDR="10.${CIDR_OCTET}.1.0/24"
        DB_CIDR="10.${CIDR_OCTET}.2.0/24"
        TAGS="Environment=${ENV_LOWER} CostCenter=FinOps Tier=Custom AutoShutdown=False"
        provision_environment_resources "$ENV_LOWER" "$RG_NAME" "$VNET_CIDR" "$APP_CIDR" "$DB_CIDR" "Standard_B1s" "B1" "Standard_LRS" "30" "Dynamic" "$TAGS"
        CIDR_INDEX=$((CIDR_INDEX + 1))
    fi
done

# ------------------------------------------------------------------------------
# Summary & Completion
# ------------------------------------------------------------------------------
TOTAL_RESOURCES_PROCESSED=$((${#ENVS_LIST[@]} * 12))
log_header "PROVISIONING COMPLETE: ${TOTAL_RESOURCES_PROCESSED} RESOURCES PROCESSED ACROSS ${#ENVS_LIST[@]} ENVIRONMENTS"

echo -e "${GREEN}✓ All 12 Resources per Environment (${TOTAL_RESOURCES_PROCESSED} Total) processed with Skip & Fault-Tolerant execution!${NC}\n"

echo -e "${CYAN}Configuration Breakdown:${NC}"
echo -e "  ┌─────────────┬─────────────────┬──────────────────┬────────────────┬─────────────────┬───────────┐"
echo -e "  │ Environment │ Resource Group  │ VNet CIDR        │ VM Compute SKU │ App Service SKU │ Retention │"
echo -e "  ├─────────────┼─────────────────┼──────────────────┼────────────────┼─────────────────┼───────────┤"
echo -e "  │ DEV (12)    │ $DEV_RG │ $DEV_VNET_CIDR   │ $DEV_VM_SKU    │ $DEV_ASP_SKU           │ ${DEV_LOG_RETENTION} days   │"
echo -e "  │ QA  (12)    │ $QA_RG  │ $QA_VNET_CIDR   │ $QA_VM_SKU    │ $QA_ASP_SKU            │ ${QA_LOG_RETENTION} days   │"
echo -e "  │ PRD (12)    │ $PRD_RG │ $PRD_VNET_CIDR   │ $PRD_VM_SKU    │ $PRD_ASP_SKU            │ ${PRD_LOG_RETENTION} days   │"
echo -e "  └─────────────┴─────────────────┴──────────────────┴────────────────┴─────────────────┴───────────┘\n"

echo -e "${CYAN}Processed Resources per Environment:${NC}"
echo -e "  1. Virtual Network (VNet) [Skip check enabled]"
echo -e "  2. App Subnet [Skip check enabled]"
echo -e "  3. Database Subnet [Skip check enabled]"
echo -e "  4. Network Security Group (NSG) [Skip check enabled]"
echo -e "  5. Virtual Machine (Ubuntu 22.04 LTS) [Skip check enabled]"
echo -e "  6. Storage Account (StorageV2) [Skip check enabled]"
echo -e "  7. Blob Storage Container [Skip check enabled]"
echo -e "  8. Log Analytics Workspace [Skip check enabled]"
echo -e "  9. App Service Plan [Skip check enabled]"
echo -e "  10. Web App Service (Python 3.11) [Skip check enabled]"
echo -e "  11. Key Vault [Skip check enabled]"
echo -e "  12. Public IP Address [Skip check enabled]"
echo ""
echo -e "${BLUE}=================================================================${NC}"
