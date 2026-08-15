# 📘 Azure AKS Deployment & FinOps Operations Guide

This directory contains the step-by-step execution guides for provisioning, configuring, and operating the AI-Powered Cloud Cost Optimization Platform on **Azure Kubernetes Service (AKS)**.

---

## 🗺️ Step-by-Step Documentation Index

1. **[01 - Prerequisites & Tooling Setup](01-prerequisites.md)**: Install Azure CLI, Terraform, Helm, kubectl, and configure ACR credentials.
2. **[02 - Terraform AKS Provisioning](02-terraform-aks-provisioning.md)**: Setup remote state backend inside `finops-global-rg` (`eastus`) and provision AKS cluster with VNet.
3. **[03 - kubectl AKS Context Configuration](03-kubectl-aks-context.md)**: Configure `kubectl` cluster credentials and verify cluster nodes.
4. **[04 - Namespaces & RBAC Setup](04-namespaces-and-rbac.md)**: Create `finops`, `ingress-traefik`, `observability`, and `argocd` namespaces with RBAC roles.
5. **[05 - Deploy In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**: Deploy local PostgreSQL database (`postgres:15-alpine`) with 10Gi PVC storage.
6. **[06 - Traefik Ingress Setup on AKS](06-traefik-ingress-azure.md)**: Deploy Traefik v3 Ingress LoadBalancer and fetch Public IP.
7. **[07 - Helm Application Deployment & HPA Setup](07-helm-app-deployment-aks.md)**: Deploy the 3 microservices with HorizontalPodAutoscaler (HPA).
8. **[08 - ArgoCD GitOps Continuous Deployment Setup](08-argocd-gitops-aks.md)**: Configure automated GitOps synchronization via ArgoCD on AKS.
9. **[09 - Observability Stack on AKS](09-observability-azure.md)**: Deploy Prometheus Operator, Grafana dashboards, and Loki log aggregator.
10. **[10 - PostgreSQL Validation & Connection Testing](10-postgresql-validation-azure.md)**: Validate database schema, active remediations, and inter-pod connectivity.
11. **[11 - GitHub Actions CI/CD Pipeline Setup](11-github-actions-ci-cd-azure.md)**: Configure automated ACR image building and GitOps version bumping.
12. **[12 - One-Click Azure Deployment Script](12-one-click-azure-deploy.md)**: One-command automated cluster deployment and teardown guide.

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

## 🛠️ Azure Infrastructure Provisioner Script

The platform includes an automated Azure resource provisioner script:
```bash
./script_to_create_Az/create_azure_resources.sh --envs dev,qa,prd snapthreadz eastus
```

To tear down all resources:
```bash
./script_to_create_Az/create_azure_resources.sh --destroy --envs dev,qa,prd snapthreadz eastus
```
