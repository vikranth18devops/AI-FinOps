# 05 - In-Cluster PostgreSQL Database on GKE

<p align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-StatefulSet-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-PVC_Storage-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
Deploy an in-cluster PostgreSQL StatefulSet with a `10Gi` PersistentVolumeClaim (PVC) to store cost investigation reports, user auth, and remediation logs.

---

## ⚡ Deployment Commands

```bash
# 1. Return to repository root directory
cd /Users/aarvik/Documents/123

# 2. Render and apply PostgreSQL StatefulSet, Secret, and Service
helm template finops ./chart --show-only templates/postgres-statefulset.yaml | kubectl apply -f -

# Verify PostgreSQL Pod & PVC state
kubectl get pods,pvc -n finops -l app=postgres
```

---

Next Step: **[06-Traefik Ingress Setup on GKE](06-traefik-ingress-gcp.md)**
