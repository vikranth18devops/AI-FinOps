# 03 - Connect Kubectl Context to AWS EKS

## 📌 Step Overview
After provisioning the EKS cluster with Terraform, you must fetch cluster credentials and bind your local `kubectl` CLI context to the newly created **Amazon EKS** cluster.

---

## ⚡ Connection Commands

Execute `aws eks update-kubeconfig` to download cluster kubeconfig credentials:

```bash
# 1. Export AWS Region & EKS Cluster Name
export AWS_REGION="us-east-1"
export EKS_CLUSTER_NAME="finops-eks-cluster"

# 2. Update Kubeconfig Credentials
aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME"
```

---

## 🔍 Verification Commands

### 1. Verify Current Kubectl Context
```bash
kubectl config current-context
```

### 2. Verify Cluster Worker Nodes
List all nodes running in your EKS cluster:
```bash
kubectl get nodes -o wide
```

### 3. Check System Pods Health
Ensure core Kubernetes system services (CoreDNS, kube-proxy, aws-node) are running cleanly:
```bash
kubectl get pods -n kube-system
```

---

Next Step: **[04-Namespaces & IRSA RBAC](04-namespaces-and-rbac.md)**
