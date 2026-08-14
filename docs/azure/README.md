# 📘 Azure AKS Deployment & FinOps Operations Guide

This guide details the complete deployment, operations, and FinOps scanning pipeline for **Azure AKS (Azure Kubernetes Service)**.

---

## 🏗️ 3-Tier Microservice Stack Overview

1. **React Frontend Dashboard (`application/frontend`)**: Port `5173`
2. **FastAPI Backend API (`application/backend`)**: Port `8000`
3. **UI_Script Provisioner Studio (`application/UI_Script`)**: Port `8500`

---

## 🚀 Quick Start & Local Execution

Launch the entire 3-service stack simultaneously from workspace root:
```bash
./start_local.sh
```

- **Backend API**: `http://localhost:8000`
- **Frontend Dashboard**: `http://localhost:5173`
- **UI_Script Provisioner**: `http://localhost:8500`

---

## 🛠️ Azure Infrastructure Provisioner

The platform includes an automated Azure resource provisioner script:
```bash
./script_to_create_Az/create_azure_resources.sh --envs dev,qa,prd snapthreadz westeurope
```

Provisions 12 resources per environment in Azure:
1. Virtual Network (VNet)
2. App Subnet
3. Database Subnet
4. Network Security Group (NSG)
5. Ubuntu Virtual Machine (Standard_B1s)
6. Storage Account (StorageV2)
7. Blob Storage Container
8. Log Analytics Workspace
9. App Service Plan (B1)
10. Web App Service (Python 3.11)
11. Azure Key Vault
12. Public IP Address

To tear down all resources:
```bash
./script_to_create_Az/create_azure_resources.sh --destroy --envs dev,qa,prd snapthreadz westeurope
```

---

## 🐳 Dockerization & Kubernetes Deployment

- **UI_Script Dockerfile**: `application/UI_Script/Dockerfile`
- **Backend Dockerfile**: `application/backend/Dockerfile`
- **Frontend Dockerfile**: `application/frontend/Dockerfile`

### Helm Chart Deployment
```bash
helm upgrade --install finops ./chart \
  --namespace finops \
  --create-namespace \
  --set image.repository=myregistry.azurecr.io/finops \
  --set service.uiScriptPort=8500
```

---

## 🔄 CI/CD & GitOps Integration

- **GitHub Actions Pipeline**: `.github/workflows/ci-cd.yml` builds and pushes `backend`, `frontend`, and `ui_script` Docker images.
- **ArgoCD Application**: `argocd/application.yaml` continuously syncs `chart/` manifests to Azure AKS.
- **Prometheus Monitoring**: `chart/monitoring/servicemonitor-ui-script.yaml` monitors `ui_script` metrics on port `8500`.
