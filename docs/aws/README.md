# 📘 AWS EKS Deployment & FinOps Operations Guide

This directory contains the step-by-step execution guides for provisioning, configuring, and operating the AI-Powered Cloud Cost Optimization Platform on **Amazon Elastic Kubernetes Service (EKS)**.

---

## 🗺️ Step-by-Step Documentation Index (1 - 13)

1. **[01 - Prerequisites & Tooling Setup](01-prerequisites.md)**: Install AWS CLI, Terraform, Helm, kubectl, and configure ECR credentials.
2. **[02 - Terraform EKS Provisioning](02-terraform-eks-provisioning.md)**: Setup remote state backend S3 bucket & DynamoDB lock table, and provision EKS cluster in `us-east-1`.
3. **[03 - kubectl EKS Context Configuration](03-kubectl-eks-context.md)**: Configure `kubectl` cluster credentials and verify cluster nodes.
4. **[04 - Namespaces & IRSA RBAC Setup](04-namespaces-and-rbac.md)**: Create `finops`, `observability`, `logging`, `ingress-traefik`, `argocd`, and `cert-manager` namespaces with RBAC roles.
5. **[05 - Deploy In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**: Deploy local PostgreSQL database (`postgres:15-alpine`) with 10Gi EBS PVC storage.
6. **[06 - Traefik Ingress Setup on EKS](06-traefik-ingress-aws.md)**: Deploy Traefik v3 Ingress LoadBalancer and fetch Public ELB Hostname.
7. **[07 - ArgoCD GitOps Continuous Deployment Setup](07-argocd-gitops-eks.md)**: Deploy the full microservices stack via automated GitOps synchronization powered by ArgoCD.
8. **[08 - Custom Domain & GoDaddy DNS Integration](08-godaddy-dns-aws.md)**: Configure GoDaddy DNS `CNAME`/`A` record for custom domain `vikranthsunkarpally.in`.
9. **[09 - Observability Stack on EKS](09-observability-aws.md)**: Deploy Prometheus Operator, Grafana dashboards, Loki log aggregator, and PromQL queries.
10. **[10 - HTTPS TLS with Let's Encrypt & Path-Routed Sub-Apps](10-https-letsencrypt-aws.md)**: Install cert-manager, issue Let's Encrypt TLS certificate, configure HTTPS (`websecure`) entryPoint, and redirect HTTP to HTTPS.
11. **[11 - PostgreSQL Validation & Connection Testing](11-postgresql-validation-aws.md)**: Validate database schema, active remediations, and inter-pod connectivity.
12. **[12 - GitHub Actions CI/CD Pipeline Setup](12-github-actions-ci-cd-aws.md)**: Configure automated ECR image building and GitOps version bumping.
13. **[13 - One-Click AWS Deployment Script](13-one-click-aws-deploy.md)**: One-command automated cluster deployment and teardown guide.

---

<p align="center">
  <b>AI Cloud Cost Detective &copy; 2026. Microservices AI FinOps Intelligence Platform.</b><br/>
  Implemented by <a href="https://www.linkedin.com/in/vikranth-sunkarpally/" target="_blank"><b>Vikranth Sunkarpally</b></a>
</p>

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
