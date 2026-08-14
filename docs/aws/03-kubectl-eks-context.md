# 03 - Connect Kubectl Context to AWS EKS

## 📌 Step Overview
Bind your local `kubectl` CLI context to your **Amazon EKS** cluster using the AWS CLI.

---

## ⚡ Connection Command

```bash
aws eks update-kubeconfig --region us-east-1 --name "$EKS_CLUSTER_NAME"
```

---

## 🔍 Verification Command

```bash
kubectl get nodes -o wide
```

---

Next Step: **[04-Namespaces & IRSA RBAC](04-namespaces-and-rbac.md)**
