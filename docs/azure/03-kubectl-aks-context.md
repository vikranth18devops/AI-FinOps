# 03 - Connect Kubectl Context to Azure AKS

## 📌 Step Overview
After provisioning the AKS cluster with Terraform, you must fetch cluster credentials and bind your local `kubectl` CLI context to the newly created **Azure Kubernetes Service (AKS)** cluster.

---

## ⚡ Connection Commands

Execute `az aks get-credentials` to download kubeconfig cluster certificates and merge them into `~/.kube/config`:

```bash
# 1. Export Resource Group & AKS Cluster Name
export AZURE_RG="finops-global-rg"
export AKS_CLUSTER_NAME="finops-aks-cluster"

# 2. Download Kubeconfig Credentials
az aks get-credentials \
  --resource-group "$AZURE_RG" \
  --name "$AKS_CLUSTER_NAME" \
  --overwrite-existing
```

---

## 🔍 Verification Commands

### 1. Verify Current Kubectl Context
```bash
kubectl config current-context
```
> Expected Output: `finops-aks-cluster`

### 2. Verify Cluster Worker Nodes
List all nodes running in your AKS cluster:
```bash
kubectl get nodes -o wide
```
Expected Output:
```
NAME                                STATUS   ROLES    AGE   VERSION   INTERNAL-IP   OS-IMAGE
aks-systempool-12345678-vmss000000   Ready    <none>   5m    v1.28.3   10.0.1.4      Ubuntu 22.04.3 LTS
aks-systempool-12345678-vmss000001   Ready    <none>   5m    v1.28.3   10.0.1.5      Ubuntu 22.04.3 LTS
aks-systempool-12345678-vmss000002   Ready    <none>   5m    v1.28.3   10.0.1.6      Ubuntu 22.04.3 LTS
```

### 3. Check System Pods Health
Ensure core Kubernetes system services are running cleanly:
```bash
kubectl get pods -n kube-system
```

---

Next Step: **[04-Namespaces & Azure RBAC](04-namespaces-and-rbac.md)**
