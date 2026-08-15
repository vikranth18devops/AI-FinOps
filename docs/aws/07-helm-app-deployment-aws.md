# 07 - Helm Application Deployment on AWS EKS

<p align="left">
  <img src="https://img.shields.io/badge/Helm-v3-0F1689?style=for-the-badge&logo=helm&logoColor=white" />
  <img src="https://img.shields.io/badge/Microservices-3_Tier-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
Deploy the 3 application microservices (**React Frontend**, **FastAPI Backend**, and **UI_Script Provisioner Studio**) and **In-Cluster PostgreSQL** to EKS with **HorizontalPodAutoscaler (HPA v2)** using Helm.

---

## ⚡ Deployment Commands

```bash
# 1. Clean up pre-existing standalone PostgreSQL resources from Step 05 so Helm can manage them
kubectl delete secret postgres-secret -n finops --ignore-not-found
kubectl delete service postgres-service -n finops --ignore-not-found
kubectl delete statefulset postgres -n finops --ignore-not-found

# 2. Deploy FinOps Application Stack
helm upgrade --install finops ./chart \
  --namespace finops \
  --create-namespace \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=2 \
  --set autoscaling.maxReplicas=10 \
  --set autoscaling.targetCPUUtilizationPercentage=60 \
  --wait
```

---

## 🔍 Pod & Ingress Verification

```bash
# 1. Verify Pods
kubectl get pods -n finops

# 2. Verify Ingress Routing
kubectl get ingress -n finops
```

Verify `finops-backend`, `finops-frontend`, `finops-ui-script`, and `postgres-0` pods are in `Running` state.

---

Next Step: **[08-Observability Stack on EKS](08-observability-aws.md)**
