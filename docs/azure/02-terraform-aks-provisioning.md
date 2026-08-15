# 02 - Terraform AKS Infrastructure Provisioning & Remote State Setup

<p align="left">
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/Microsoft_Azure-Blob_Storage-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/AKS-Cluster_Provisioning-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
In this step, you will setup the Azure Blob Storage remote state backend inside **`finops-global-rg`** and provision cloud infrastructure on Azure using modular **Terraform** code located in [`terraform/azure/`](file:///Users/aarvik/Documents/123/terraform/azure).

The Terraform workflow provisions:
1. **Azure Storage Account & Blob Container**: Stores remote state (`azure.aks.tfstate`) inside **`finops-global-rg`**.
2. **Azure Resource Group**: `finops-azure-rg` in `eastus`.
3. **Virtual Network (VNet)** (`10.0.0.0/16`) and **Subnet** (`10.0.1.0/24`).
4. **Azure Kubernetes Service (AKS)** cluster (`finops-aks-cluster`) with defined node pool:
   - **Worker VM Size**: `Standard_D4s_v5` (4 vCPU, 16 GB RAM)
   - **OS Disk Size**: `128 GB` Managed Disk
   - **Auto-Scaling**: Enabled (`2` to `5` worker nodes)
   - **Node Labels**: `role=worker`, `environment=production`

---

## 🗄️ Step 1: Create Azure Storage Account in `finops-global-rg`

Run the following Azure CLI commands in your terminal to create the Resource Group `finops-global-rg`, Storage Account, and Blob Container for Terraform state storage:

```bash
# 1. Set environment variables
export STATE_RG="finops-global-rg"
export STORAGE_ACCOUNT_NAME="tfstatefinops$RANDOM"
export CONTAINER_NAME="tfstate"
export LOCATION="westeurope"

# 2. Create Azure Global Resource Group
az group create --name $STATE_RG --location $LOCATION

# 3. Create Azure Storage Account inside finops-global-rg
az storage account create \
    --resource-group $STATE_RG \
    --name $STORAGE_ACCOUNT_NAME \
    --sku Standard_LRS \
    --encryption-services blob

# 4. Create Blob Storage Container
az storage container create \
    --name $CONTAINER_NAME \
    --account-name $STORAGE_ACCOUNT_NAME

# 5. Retrieve Storage Account Access Key
export ACCOUNT_KEY=$(az storage account keys list --resource-group $STATE_RG --account-name $STORAGE_ACCOUNT_NAME --query "[0].value" -o tsv)

echo "================================================================="
echo "  ✓ Azure Remote State Storage Account Created Successfully!"
echo "  • Resource Group:  $STATE_RG"
echo "  • Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  • Container Name:  $CONTAINER_NAME"
echo "================================================================="
```

---

## 🏗️ Step 2: Configure Terraform Backend (`terraform/azure/main.tf`)

Update the backend block inside [`terraform/azure/main.tf`](file:///Users/aarvik/Documents/123/terraform/azure/main.tf) with `resource_group_name = "finops-global-rg"`:

```hcl
terraform {
  required_version = ">= 1.5.0"
  backend "azurerm" {
    resource_group_name  = "finops-global-rg"
    storage_account_name = "tfstatefinops23662"
    container_name       = "tfstate"
    key                  = "azure.aks.tfstate"
  }
}

provider "azurerm" {
  skip_provider_registration = true
  features {}
}
```

---

## ⚡ Step 3: Provision AKS Infrastructure via Terraform

### 1. Navigate to Azure Terraform Directory
```bash
cd terraform/azure
```

### 2. Initialize Remote Backend & Provider Modules
`terraform init` initializes the AzureRM provider and connects to the remote Azure Blob `tfstate` storage backend:
```bash
terraform init \
    -backend-config="resource_group_name=finops-global-rg" \
    -backend-config="storage_account_name=$STORAGE_ACCOUNT_NAME" \
    -backend-config="container_name=tfstate" \
    -backend-config="key=azure.aks.tfstate"
```

### 3. Review Infrastructure Execution Plan
Inspect the resources Terraform will create:
```bash
terraform plan
```

### 4. Apply Infrastructure Configuration
Provision the VNet, Subnet, and AKS Cluster:
```bash
terraform apply -auto-approve
```

---

## 🔍 Step 4: Verification & Health Checks

```bash
# Check created Azure Resource Group
az group show --name "finops-global-rg"

# Check AKS Cluster status in Azure CLI
az aks show --resource-group "finops-global-rg" --name "finops-aks-cluster" --query "provisioningState"
```
> Expected Output: `"Succeeded"`

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-aks-context.md)**
