# 06 - Traefik Ingress Controller for AWS EKS

## 📌 Ingress Architecture

Traefik routes traffic to all three application microservices in the `finops` namespace:
- `http://<INGRESS-IP>/` -> `finops-frontend-service:80`
- `http://<INGRESS-IP>/api` -> `finops-backend-service:8000`
- `http://<INGRESS-IP>/studio` -> `finops-ui-script-service:8500`

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

## 🔍 Fetch AWS Network LoadBalancer IP / Hostname

```bash
kubectl get svc -n ingress-traefik traefik
```

---

Next Step: **[07-Helm App Deployment on AWS](07-helm-app-deployment-aws.md)**
