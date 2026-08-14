# 07 - Helm Application Deployment on GKE

<p align="left">
  <img src="https://img.shields.io/badge/Helm-v3-0F1689?style=for-the-badge&logo=helm&logoColor=white" />
  <img src="https://img.shields.io/badge/Microservices-3_Tier-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
Deploy the 3 application microservices (**React Frontend**, **FastAPI Backend**, and **UI_Script Provisioner Studio**) to GKE using Helm.

---

## ⚡ Deployment Commands

```bash
helm upgrade --install finops ./chart \
  --namespace finops \
  --create-namespace \
  --set image.repository=us-central1-docker.pkg.dev/my-gcp-project/finops-repo \
  --set service.uiScriptPort=8585 \
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
