# 04 - Namespaces & RBAC Setup on GKE

<p align="left">
  <img src="https://img.shields.io/badge/Kubernetes-Namespace-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Security-RBAC_Hardening-00C853?style=for-the-badge&logo=shield&logoColor=white" />
</p>

## 📌 Step Overview
Create the dedicated `finops` namespace and configure RBAC ServiceAccounts & RoleBindings for cluster security.

---

## ⚡ Execution Commands

```bash
# Create target namespace
kubectl create namespace finops --dry-run=client -o yaml | kubectl apply -f -

# Verify namespace state
kubectl get ns finops
```

---

Next Step: **[05-In-Cluster PostgreSQL Database Setup](05-in-cluster-postgresql.md)**
