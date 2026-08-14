# 01 - Prerequisites & GitHub Secrets Setup for Azure AKS

## 📌 Prerequisites Checklist

Before deploying the AI Cloud Cost Detective microservices stack to Azure AKS, ensure the following tools are installed and configured:

1. **Azure CLI (`az`)**: Installed and authenticated (`az login`).
2. **Terraform (v1.5+)**: Installed for Azure Resource Group & AKS cluster provisioning.
3. **kubectl**: Configured to interact with Kubernetes clusters (`az aks get-credentials`).
4. **Helm (v3.10+)**: Installed for chart deployments.
5. **Docker**: Running locally to build `backend`, `frontend`, and `ui_script` container images.

---

## 🚀 Microservice Architecture Stack

The application stack consists of 3 microservices located in [`application/`](file:///Users/aarvik/Documents/123/application):
- **React Frontend**: `application/frontend` (Port 3000)
- **FastAPI Backend**: `application/backend` (Port 8080)
- **UI_Script Provisioner**: `application/UI_Script` (Port 8585)

Local Simultaneous Launcher:
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
Run the following commands in your terminal:
```bash
# Set variables
export RG_NAME="finops-global-rg"
export ACR_NAME="finopsacr2026$RANDOM"
export LOCATION="westeurope"

# 1. Create Resource Group
az group create --name $RG_NAME --location $LOCATION

# 2. Create Azure Container Registry
az acr create --resource-group $RG_NAME --name $ACR_NAME --sku Basic

# 3. Enable Admin user for credentials access
az acr update --name $ACR_NAME --admin-enabled true
```

---

### 2️⃣ Obtain ACR Credentials for GitHub Secrets
```bash
# 1. Get ACR Login Server
az acr show --name $ACR_NAME --query loginServer -o tsv

# 2. Get ACR Username
az acr credential show --name $ACR_NAME --query username -o tsv

# 3. Get ACR Password
az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv
```

---

### 3️⃣ Adding Secrets to GitHub Repository
1. Open your GitHub Repository: **`https://github.com/vikranth18devops/AI-FinOps`**
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add each secret:

| Secret Name | Value to Paste |
| :--- | :--- |
| **`ACR_LOGIN_SERVER`** | Output of `az acr show --name $ACR_NAME --query loginServer -o tsv` (e.g. `finopsacr2026.azurecr.io`) |
| **`ACR_USERNAME`** | Output of `az acr credential show --name $ACR_NAME --query username -o tsv` |
| **`ACR_PASSWORD`** | Output of `az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv` |

---

Next Step: **[02-Terraform AKS Provisioning](02-terraform-aks-provisioning.md)**
