# 06 - Traefik Ingress Controller for AWS EKS

## 📌 Ingress Architecture

Traefik routes traffic to all three application microservices in the `finops` namespace:
- `http://<INGRESS-IP>/` -> `finops-frontend-service:80`
- `http://<INGRESS-IP>/api` -> `finops-backend-service:8000`
- `http://<INGRESS-IP>/studio` -> `finops-ui-script-service:8500`

---

## ⚡ Deployment Commands

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
helm install traefik traefik/traefik -n traefik --create-namespace
```

---

Next Step: **[07-Helm App Deployment on AWS](07-helm-app-deployment-aws.md)**
