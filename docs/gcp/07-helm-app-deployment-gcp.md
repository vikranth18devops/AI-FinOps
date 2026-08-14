# 07 - Helm Application Deployment on GCP GKE

## 📌 Step Overview
Deploy the 3 application microservices (**React Frontend**, **FastAPI Backend**, and **UI_Script Provisioner Studio**) to GKE using Helm.

---

## ⚡ Deployment Commands

```bash
helm upgrade --install finops ./chart \
  --namespace finops \
  --create-namespace \
  --set image.repository=myregistry.azurecr.io/finops \
  --set service.uiScriptPort=8500 \
  --wait
```

---

## 🔍 Pod Verification

```bash
kubectl get pods -n finops
```

Verify `finops-backend`, `finops-frontend`, and `finops-ui-script` pods are in `Running` state.

---

Next Step: **[08-Observability Stack on GKE](08-observability-gcp.md)**
