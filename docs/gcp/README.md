# 🔴 GCP GKE Deployment & FinOps Operations Guide

This guide details the complete deployment, operations, and FinOps scanning pipeline for **GCP GKE (Google Kubernetes Engine)**.

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

## 🛠️ GCP Multi-Cloud Infrastructure Provisioner

The platform includes an automated GCP resource provisioner script:
```bash
./script_to_create_Az/create_gcp_resources.sh --envs dev,qa,prd snapthreadz us-central1
```

Provisions 12 resources per environment in GCP:
1. VPC Network
2. Custom Subnet
3. Firewall Rule
4. Compute Engine VM (e2-micro)
5. Cloud Storage Bucket
6. Cloud Logging Sink
7. Cloud Run Service
8. Secret Manager Secret
9. External Static IP Address
10. IAM Service Account
11. Cloud Monitoring Metric
12. Artifact Registry Repository

To tear down all resources:
```bash
./script_to_create_Az/create_gcp_resources.sh --destroy --envs dev,qa,prd snapthreadz us-central1
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
- **ArgoCD Application**: `argocd/application.yaml` continuously syncs `chart/` manifests to GCP GKE.
- **Prometheus Monitoring**: `chart/monitoring/servicemonitor-ui-script.yaml` monitors `ui_script` metrics on port `8500`.
