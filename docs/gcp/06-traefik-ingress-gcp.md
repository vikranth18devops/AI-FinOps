# 06 - Traefik Ingress Controller on GKE

<p align="left">
  <img src="https://img.shields.io/badge/Traefik-Ingress_Controller-24A1DE?style=for-the-badge&logo=traefik&logoColor=white" />
  <img src="https://img.shields.io/badge/Networking-HTTP_Routing-00E676?style=for-the-badge&logo=nginx&logoColor=white" />
</p>

## 📌 Ingress Architecture

Traefik routes traffic to all three application microservices in the `finops` namespace:
- 📱 `http://<INGRESS-IP>/` -> `finops-frontend-service:80` (Port 3000 local)
- ⚙️ `http://<INGRESS-IP>/api` -> `finops-backend-service:8000` (Port 8080 local)
- 🚀 `http://<INGRESS-IP>/studio` -> `finops-ui-script-service:8500` (Port 8585 local)

---

## ⚡ Deployment Commands

```bash
# 1. Add Traefik Helm repository
helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update

# 2. Deploy Traefik Ingress Controller in namespace ingress-traefik
helm upgrade --install traefik traefik/traefik \
  --namespace ingress-traefik --create-namespace \
  --wait
```

---

## 🔍 Fetch GCP External LoadBalancer Public IP

```bash
kubectl get svc -n ingress-traefik traefik
```

---

Next Step: **[07-Helm Application Deployment on GKE](07-helm-app-deployment-gcp.md)**
