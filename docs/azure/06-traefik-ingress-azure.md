# 06 - Deploy Traefik Ingress Controller on Azure AKS

## 📌 Step Overview
In this step, you will deploy **Traefik Ingress Controller** via Helm to manage HTTP (Port 80) and HTTPS (Port 443) ingress traffic. Deploying Traefik provisions an Azure Standard LoadBalancer public IP address.

---

## ⚡ Deployment Commands

```bash
# 1. Add Traefik Helm repository
helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update

# 2. Deploy Traefik in namespace ingress-traefik
helm upgrade --install traefik traefik/traefik \
  --namespace ingress-traefik --create-namespace \
  --set ports.web.redirectTo=websecure \
  --wait
```

---

## 🔍 Fetch LoadBalancer Public IP

Execute `kubectl get svc` to retrieve your public IP assigned by Azure:

```bash
kubectl get svc -n ingress-traefik traefik
```

Expected Output:
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                      AGE
traefik   LoadBalancer   10.0.150.20    20.12.180.45    80:32014/TCP,443:31980/TCP   2m
```

---

Next Step: **[07-Helm Application Deployment](07-helm-app-deployment-azure.md)**
