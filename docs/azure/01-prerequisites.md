# 01 - Prerequisites for Azure AKS Deployment

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
- **React Frontend**: `application/frontend` (Port 5173 / Port 80 in K8s)
- **FastAPI Backend**: `application/backend` (Port 8000)
- **UI_Script Provisioner**: `application/UI_Script` (Port 8500)

Local Simultaneous Launcher:
```bash
./start_local.sh
```

---

Next Step: **[02-Terraform AKS Provisioning](02-terraform-aks-provisioning.md)**
