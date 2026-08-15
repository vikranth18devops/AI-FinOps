# 07 - Helm Application Deployment & HPA Setup on AKS

<p align="left">
  <img src="https://img.shields.io/badge/Helm-v3-0F1689?style=for-the-badge&logo=helm&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-HPA_Autoscaling-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
Deploy the 3 application microservices (**React Frontend**, **FastAPI Backend**, and **UI_Script Provisioner Studio**) and **In-Cluster PostgreSQL** to Azure AKS with **HorizontalPodAutoscaler (HPA v2)** using Helm.

> [!NOTE]
> The Helm chart uses universal Kubernetes `networking.k8s.io/v1` `Ingress` with `ingressClassName: traefik`, ensuring 100% compatibility across any Azure subscription, resource group, or region without requiring pre-installed Traefik CRDs!

---

## ⚡ Deployment Commands

```bash
# 1. Clean up pre-existing standalone PostgreSQL resources from Step 05 so Helm can manage them
kubectl delete secret postgres-secret -n finops --ignore-not-found
kubectl delete service postgres-service -n finops --ignore-not-found
kubectl delete statefulset postgres -n finops --ignore-not-found

# 2. Deploy full FinOps Application Stack with HPA Autoscaling
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

# 3. Verify Ingress Routing
kubectl get ingress -n finops
```

> Expected HPA Output:
> ```
> NAME                   REFERENCE                   TARGETS   MINPODS   MAXPODS   REPLICAS
> finops-backend-hpa     Deployment/finops-backend     12%/60%   2         10        2
> finops-frontend-hpa    Deployment/finops-frontend    5%/60%    2         10        2
> finops-ui-script-hpa   Deployment/finops-ui-script   8%/60%    2         10        2
> ```

---

Next Step: **[08-ArgoCD GitOps Continuous Deployment](08-argocd-gitops-aks.md)**
