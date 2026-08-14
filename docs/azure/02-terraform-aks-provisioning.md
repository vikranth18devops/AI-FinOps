# 02 - Terraform AKS Infrastructure Provisioning

## 📌 Step Overview
In this step, you will provision cloud infrastructure on Azure using modular **Terraform** code located in `terraform/azure/`.

The Terraform workflow provisions:
1. **Azure Resource Group** (`finops-azure-rg`) in `eastus`.
2. **Virtual Network (VNet)** (`10.0.0.0/16`) and **Subnet** (`10.0.1.0/24`).
3. **Azure Kubernetes Service (AKS)** cluster (`finops-aks-cluster`) with 3 worker nodes (`Standard_D4s_v5`).
4. **Remote State Backend**: State is stored in Azure Blob Storage (`azure.aks.tfstate`) to enable team collaboration and state locking.

---

## 🏗️ Terraform Module Architecture

```
terraform/azure/
├── main.tf                 # Main module orchestrator & provider setup
├── variables.tf            # Input variables (region, rg_name, env)
├── outputs.tf              # Resource outputs (cluster_name, rg_name)
└── modules/
    ├── networking/         # VNet & Subnet module
    └── aks/                # AKS Cluster module
```

---

## ⚡ Execution Steps

### 1. Navigate to Azure Terraform Directory
```bash
cd terraform/azure
```

### 2. Initialize Remote Backend & Provider Modules
`terraform init` initializes the AzureRM provider and connects to the remote Azure Blob `tfstate` storage backend:
```bash
terraform init
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

### 5. Export Output Environment Variables
```bash
export AZURE_RG=$(terraform output -raw azure_resource_group)
export AKS_CLUSTER_NAME=$(terraform output -raw aks_cluster_name)
cd ../..
```

---

## 🔍 Verification & Health Checks

```bash
# Check created Azure Resource Group
az group show --name "$AZURE_RG"

# Check AKS Cluster status in Azure CLI
az aks show --resource-group "$AZURE_RG" --name "$AKS_CLUSTER_NAME" --query "provisioningState"
```
> Expected Output: `"Succeeded"`

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-aks-context.md)**
