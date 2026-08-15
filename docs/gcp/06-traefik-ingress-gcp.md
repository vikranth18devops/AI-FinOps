# 06 - Deploy Traefik Ingress Controller on GCP GKE

## 📌 Step Overview
In this step, you will deploy **Traefik Ingress Controller** via Helm to manage HTTP (Port 80) and HTTPS (Port 443) ingress traffic. Deploying Traefik provisions a GCP External Regional TCP/UDP Load Balancer public IP address.

---

## ⚡ Deployment Commands

```bash
# 1. Add Traefik Helm repository
helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update

# 2. Deploy Traefik in namespace ingress-traefik
helm upgrade --install traefik traefik/traefik \
  --namespace ingress-traefik --create-namespace \
  --wait
```

---

## 🔍 Fetch GCP LoadBalancer Public IP

Execute `kubectl get svc` to retrieve your public IP assigned by Google Cloud:

```bash
kubectl get svc -n ingress-traefik traefik
```

Expected Output:
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)                      AGE
traefik   LoadBalancer   10.96.150.20   35.224.38.103   80:32014/TCP,443:31980/TCP   2m
```

---

Next Step: **[07-ArgoCD GitOps Continuous Deployment](07-argocd-gitops-gke.md)**
