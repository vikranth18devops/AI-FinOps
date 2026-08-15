# 01 - Prerequisites & Local Tools Installation Guide for Azure AKS

<p align="left">
  <img src="https://img.shields.io/badge/Microsoft_Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Secrets-CI%2FCD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" />
  <img src="https://img.shields.io/badge/AKS-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
</p>

## 📌 Local CLI Tools Installation Guide (macOS, Linux, Windows)

To execute Azure provisioner scripts (`create_azure_resources.sh`), manage AKS Kubernetes clusters, and run local microservices (`./start_local.sh`), install the following local CLI tools:

---

### 1️⃣ Azure CLI (`az`)
Required for Azure resource provisioning, CLI authentication, and live cost scanning.

#### 🍏 macOS (Homebrew)
```bash
brew install azure-cli
```

#### 🐧 Linux (Debian / Ubuntu)
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### 🔑 Local Azure Authentication
```bash
# Login to Azure Subscription
az login

# Set Active Subscription (if multiple exist)
az account set --subscription <YOUR_SUBSCRIPTION_ID>
```
az account set --subscription afa17bb6-6630-4872-8141-2a62d46e3053
---

### 2️⃣ Kubernetes CLI (`kubectl`)
Required to inspect pods, deployments, and services running on AKS.

```bash
# macOS / Linux via Azure CLI
az aks install-cli

# Or via Homebrew
brew install kubectl
```

---

### 3️⃣ Terraform CLI (v1.5+)
Required to execute infrastructure-as-code modules under [`terraform/azure/`](file:///Users/aarvik/Documents/123/terraform/azure).

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

---

### 4️⃣ Helm 3 (Package Manager for Kubernetes)
Required to deploy application Helm charts under [`chart/`](file:///Users/aarvik/Documents/123/chart).

```bash
brew install helm
```

---

### 5️⃣ Docker Desktop
Required for local container image builds (`Dockerfile`).

```bash
brew install --cask docker
```

---

## 🚀 Microservice Architecture Stack

The application stack consists of 3 microservices located in [`application/`](file:///Users/aarvik/Documents/123/application):
- 📱 **React Frontend**: `application/frontend` (Port 3000)
- ⚙️ **FastAPI Backend**: `application/backend` (Port 8080)
- 🚀 **UI_Script Provisioner**: `application/UI_Script` (Port 8585)

Launch all 3 local microservices simultaneously:
```bash
./start_local.sh
```

---

## 🔐 How to Obtain & Set Azure GitHub Secrets (`ci-cd-azure.yml`)

The Azure AKS CI/CD pipeline requires 3 GitHub Repository Secrets:
- `ACR_LOGIN_SERVER`
- `ACR_USERNAME`
- `ACR_PASSWORD`

Follow the step-by-step instructions below to generate each secret:

### 1️⃣ Create Azure Container Registry (ACR) & Enable Admin
Run the following terminal commands:
```bash
# Set environment variables
export RG_NAME="finops-global-rg"
export ACR_NAME="finopsacr2026$RANDOM"
export LOCATION="eastus"

# 1. Create Azure Resource Group
az group create --name $RG_NAME --location $LOCATION

# 2. Create Azure Container Registry (ACR)
az acr create --resource-group $RG_NAME --name $ACR_NAME --sku Basic

# 3. Enable Admin User for ACR credential access
az acr update --name $ACR_NAME --admin-enabled true
```

---

### 2️⃣ Obtain ACR Credentials for GitHub Secrets
Run the following commands in your terminal:
```bash
# 1. Get ACR Login Server Name
az acr show --name $ACR_NAME --query loginServer -o tsv
# Example Output: finopsacr2026.azurecr.io

# 2. Get ACR Username
az acr credential show --name $ACR_NAME --query username -o tsv 
# Example Output: finopsacr2026

# 3. Get ACR Password
az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv
# Example Output: aB3dF6gH9jK1mN4pQ7rS0tU2vW5xY8z
```

---

### 3️⃣ Adding Secrets to GitHub Repository
1. Open your GitHub Repository: **`https://github.com/vikranth18devops/AI-FinOps`**
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add each secret:

| Secret Name | How to Get Value | Example Output Value |
| :--- | :--- | :--- |
| **`ACR_LOGIN_SERVER`** | `az acr show --name $ACR_NAME --query loginServer -o tsv` | `finopsacr2026.azurecr.io` |
| **`ACR_USERNAME`** | `az acr credential show --name $ACR_NAME --query username -o tsv` | `finopsacr2026` |
| **`ACR_PASSWORD`** | `az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv` | `aB3dF6gH9jK1mN4p...` |

---

Next Step: **[02-Terraform AKS Provisioning](02-terraform-aks-provisioning.md)**

Vikranth Sunkarpally

