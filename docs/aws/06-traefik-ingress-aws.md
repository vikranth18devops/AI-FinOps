# 06 - Deploy Traefik Ingress Controller on AWS EKS

## 📌 Step Overview
In this step, you will deploy **Traefik Ingress Controller** via Helm to manage HTTP (Port 80) and HTTPS (Port 443) ingress traffic. Deploying Traefik provisions an AWS Network Load Balancer (NLB) or Classic Load Balancer DNS hostname.

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

## 🔍 Fetch AWS Network LoadBalancer Hostname

Execute `kubectl get svc` to retrieve the LoadBalancer hostname assigned by AWS:

```bash
kubectl get svc -n ingress-traefik traefik
```

Expected Output:
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP                                                             PORT(S)                      AGE
traefik   LoadBalancer   10.100.150.20  a123456789-123456789.us-east-1.elb.amazonaws.com                        80:32014/TCP,443:31980/TCP   2m
```

---

Next Step: **[07-ArgoCD GitOps Continuous Deployment](07-argocd-gitops-eks.md)**
