# 06 - Deploy Traefik Ingress Controller on GCP GKE

## 📌 Step Overview
Deploy **Traefik Ingress Controller** via Helm to provision a GCP External HTTP(S) LoadBalancer IP address.

---

## ⚡ Deployment Commands

```bash
helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update

helm upgrade --install traefik traefik/traefik \
  --namespace ingress-traefik --create-namespace \
  --set ports.web.redirectTo=websecure \
  --wait
```

---

## 🔍 Fetch GCP LoadBalancer IP

```bash
kubectl get svc -n ingress-traefik traefik
```

---

Next Step: **[07-Helm Application Deployment](07-helm-app-deployment-gcp.md)**
