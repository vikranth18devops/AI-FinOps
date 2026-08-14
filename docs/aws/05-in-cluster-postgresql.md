# 05 - Deploy In-Cluster PostgreSQL StatefulSet on EKS

## 📌 Step Overview
Deploy the in-cluster **PostgreSQL database** (`postgres:15-alpine`) as a **StatefulSet** with a `10Gi` PVC bound to AWS EBS storage (`gp2` / `gp3`).

---

## ⚡ Deployment Commands

```bash
kubectl apply -f chart/templates/postgres-statefulset.yaml -n finops
```

---

## 🔍 Verification Commands

```bash
kubectl get pods -l app=postgres -n finops
kubectl get pvc -n finops
```

---

Next Step: **[06-Traefik Ingress on EKS](06-traefik-ingress-aws.md)**
