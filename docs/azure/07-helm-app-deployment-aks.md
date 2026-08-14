# 07 - Helm Application Deployment & HPA Setup on AKS

<p align="left">
  <img src="https://img.shields.io/badge/Helm-v3-0F1689?style=for-the-badge&logo=helm&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-HPA_Autoscaling-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
Deploy the 3 application microservices (**React Frontend**, **FastAPI Backend**, and **UI_Script Provisioner Studio**) to Azure AKS with **HorizontalPodAutoscaler (HPA v2)** using Helm.

---

## ⚡ Deployment Commands

```bash
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

## 🔍 Verification & HPA Monitoring

```bash
# 1. Verify Pods
kubectl get pods -n finops

# 2. Verify HorizontalPodAutoscalers (HPA)
kubectl get hpa -n finops
```

> Expected HPA Output:
> ```
> NAME                   REFERENCE                   TARGETS   MINPODS   MAXPODS   REPLICAS
> finops-backend-hpa     Deployment/finops-backend     12%/60%   2         10        2
> finops-frontend-hpa    Deployment/finops-frontend    5%/60%    2         10        2
> finops-ui-script-hpa   Deployment/finops-ui-script   8%/60%    2         10        2
> ```

---

Next Step: **[08-Observability Stack on AKS](08-observability-aks.md)**
