# 05 - Deploy In-Cluster PostgreSQL StatefulSet on EKS

## 📌 Step Overview
Deploy the in-cluster **PostgreSQL database** (`postgres:15-alpine`) as a **StatefulSet** with a `10Gi` PVC bound to AWS EBS storage (`gp2` / `gp3`).

---

## ⚡ Deployment Commands

```bash
# 1. Return to repository root directory
cd /Users/aarvik/Documents/123

# 2. Render and apply PostgreSQL StatefulSet, Secret, and Service
helm template finops ./chart --show-only templates/postgres-statefulset.yaml | kubectl apply -f -
```

---

## 🔍 Verification Commands

```bash
kubectl get pods -l app=postgres -n finops
kubectl get pvc -n finops
```

---

Next Step: **[06-Traefik Ingress on EKS](06-traefik-ingress-aws.md)**
