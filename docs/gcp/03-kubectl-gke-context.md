# 03 - Connect Kubectl Context to Google GKE

## 📌 Step Overview
After provisioning the GKE cluster with Terraform, you must fetch cluster credentials and bind your local `kubectl` CLI context to the newly created **Google Kubernetes Engine (GKE)** cluster.

---

## ⚡ Connection Commands

Execute `gcloud container clusters get-credentials` to download cluster kubeconfig credentials:

```bash
# 1. Export GCP Project ID, Region & GKE Cluster Name
export PROJECT_ID=$(gcloud config get-value project)
export REGION="us-central1"
export GKE_CLUSTER_NAME="finops-gke-cluster"

# 2. Update Kubeconfig Credentials
gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID"
```

---

## 🔍 Verification Commands

### 1. Verify Current Kubectl Context
```bash
kubectl config current-context
```

### 2. Verify Cluster Worker Nodes
List all nodes running in your GKE cluster:
```bash
kubectl get nodes -o wide
```

### 3. Check System Pods Health
Ensure core Kubernetes system services (CoreDNS, kube-proxy, fluentbit) are running cleanly:
```bash
kubectl get pods -n kube-system
```

---

Next Step: **[04-Namespaces & Workload Identity RBAC](04-namespaces-and-rbac.md)**
