# 📘 GCP GKE Deployment & FinOps Operations Guide

This directory contains the step-by-step execution guides for provisioning, configuring, and operating the AI-Powered Cloud Cost Optimization Platform on **Google Kubernetes Engine (GKE)**.

---

## 🗺️ Step-by-Step Documentation Index (1 - 13)

1. **[01 - Prerequisites & Tooling Setup](01-prerequisites.md)**: Install Google Cloud SDK (`gcloud`), Terraform, Helm, kubectl, and configure Artifact Registry credentials.
2. **[02 - Terraform GKE Provisioning](02-terraform-gke-provisioning.md)**: Setup remote state backend GCS bucket, and provision GKE cluster in `us-central1`.
3. **[03 - kubectl GKE Context Configuration](03-kubectl-gke-context.md)**: Configure `kubectl` cluster credentials and verify cluster nodes.
4. **[04 - Namespaces & Workload Identity RBAC Setup](04-namespaces-and-rbac.md)**: Create `finops`, `observability`, `logging`, `ingress-traefik`, `argocd`, and `cert-manager` namespaces with RBAC roles.
5. **[05 - Deploy In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**: Deploy local PostgreSQL database (`postgres:15-alpine`) with 10Gi Google Persistent Disk PVC storage.
6. **[06 - Traefik Ingress Setup on GKE](06-traefik-ingress-gcp.md)**: Deploy Traefik v3 Ingress LoadBalancer and fetch External Public LoadBalancer IP.
7. **[07 - ArgoCD GitOps Continuous Deployment Setup](07-argocd-gitops-gke.md)**: Deploy the full microservices stack via automated GitOps synchronization powered by ArgoCD.
8. **[08 - Custom Domain & GoDaddy DNS Integration](08-godaddy-dns-gcp.md)**: Configure GoDaddy DNS `A` record for custom domain `vikranthsunkarpally.in`.
9. **[09 - Observability Stack on GKE](09-observability-gcp.md)**: Deploy Prometheus Operator, Grafana dashboards, Loki log aggregator, and PromQL queries.
10. **[10 - HTTPS TLS with Let's Encrypt & Path-Routed Sub-Apps](10-https-letsencrypt-gcp.md)**: Install cert-manager, issue Let's Encrypt TLS certificate, configure HTTPS (`websecure`) entryPoint, and redirect HTTP to HTTPS.
11. **[11 - PostgreSQL Validation & Connection Testing](11-postgresql-validation-gcp.md)**: Validate database schema, active remediations, and inter-pod connectivity.
12. **[12 - GitHub Actions CI/CD Pipeline Setup](12-github-actions-ci-cd-gcp.md)**: Configure automated Artifact Registry image building and GitOps version bumping.
13. **[13 - One-Click GCP Deployment Script](13-one-click-gcp-deploy.md)**: One-command automated cluster deployment and teardown guide.

---

## 🏗️ 3-Tier Microservice Stack Overview

1. **React Frontend Dashboard (`application/frontend`)**: Port `5173`
2. **FastAPI Backend API (`application/backend`)**: Port `8000`
3. **UI_Script Provisioner Studio (`application/UI_Script`)**: Port `8585`

---

## 🚀 Quick Start & Local Execution

Launch the entire 3-service stack simultaneously from workspace root:
```bash
./start_local.sh
```

- **Backend API**: `http://localhost:8000`
- **Frontend Dashboard**: `http://localhost:5173`
- **UI_Script Provisioner**: `http://localhost:8585`
