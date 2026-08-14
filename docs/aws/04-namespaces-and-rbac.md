# 04 - Create Kubernetes Namespaces & IRSA RBAC on AWS EKS

## 📌 Step Overview
Create workload namespaces (`finops` and `observability`) and configure IAM Roles for Service Accounts (IRSA) via OIDC.

---

## ⚡ 1. Create Workload Namespaces

```bash
kubectl create namespace finops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace ingress-traefik --dry-run=client -o yaml | kubectl apply -f -
```

---

Next Step: **[05-In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**
