# 04 - Create Kubernetes Namespaces & Workload Identity on GCP GKE

## 📌 Step Overview
Create workload namespaces (`finops` and `observability`) and configure GCP Workload Identity for pod service accounts.

---

## ⚡ Namespace Creation Commands

```bash
kubectl create namespace finops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace ingress-traefik --dry-run=client -o yaml | kubectl apply -f -
```

---

Next Step: **[05-In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**
