# 01 - Prerequisites for GCP GKE Deployment

## 📌 Prerequisites Checklist

Before deploying the AI Cloud Cost Detective microservices stack to GCP GKE, ensure the following tools are installed and configured:

1. **Google Cloud SDK (`gcloud`)**: Installed and authenticated (`gcloud auth login`).
2. **Terraform (v1.5+)**: Installed for GCP VPC & GKE cluster provisioning.
3. **kubectl**: Configured to interact with Kubernetes clusters (`gcloud container clusters get-credentials`).
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

Next Step: **[02-Terraform GKE Provisioning](02-terraform-gke-provisioning.md)**
