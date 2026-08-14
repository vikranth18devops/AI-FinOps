# 📦 AWS EKS Deployment & FinOps Operations Guide

This guide details the complete deployment, operations, and FinOps scanning pipeline for **AWS EKS (Elastic Kubernetes Service)**.

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

## 🛠️ AWS Multi-Cloud Infrastructure Provisioner

The platform includes an automated AWS resource provisioner script:
```bash
./script_to_create_Az/create_aws_resources.sh --envs dev,qa,prd snapthreadz us-east-1
```

Provisions 12 resources per environment in AWS:
1. VPC
2. Public Subnet
3. Private Subnet
4. Security Group
5. EC2 Instance (t3.micro)
6. S3 Bucket
7. CloudWatch Log Group
8. App Runner Service
9. Secrets Manager Secret
10. Elastic IP Address
11. IAM Role & Policy
12. Internet Gateway

To tear down all resources:
```bash
./script_to_create_Az/create_aws_resources.sh --destroy --envs dev,qa,prd snapthreadz us-east-1
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
- **ArgoCD Application**: `argocd/application.yaml` continuously syncs `chart/` manifests to AWS EKS.
- **Prometheus Monitoring**: `chart/monitoring/servicemonitor-ui-script.yaml` monitors `ui_script` metrics on port `8500`.
