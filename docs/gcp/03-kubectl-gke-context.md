# 03 - Kubectl GKE Context Setup

<p align="left">
  <img src="https://img.shields.io/badge/Kubernetes-kubectl-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-gcloud_CLI-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>

## 📌 Step Overview
Fetch authentication credentials and configure `kubectl` context to connect to your GKE Kubernetes cluster.

---

## ⚡ Execution Commands

```bash
# Set GCP Project ID & Region
export PROJECT_ID=$(gcloud config get-value project)
export REGION="us-east1"
export CLUSTER_NAME="finops-gke-cluster"

# Fetch GKE Cluster Credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID

# Verify connection to GKE cluster
kubectl get nodes -o wide
```

---

Next Step: **[04-Namespaces and RBAC Setup](04-namespaces-and-rbac.md)**
