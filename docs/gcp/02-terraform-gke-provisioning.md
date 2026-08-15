# 02 - Terraform GKE Infrastructure Provisioning & Remote State Setup

<p align="left">
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-Cloud_Storage-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/GKE-Cluster_Provisioning-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
In this step, you will setup the Google Cloud Storage (GCS) remote state backend and provision cloud infrastructure on GCP using modular **Terraform** code located in [`terraform/gcp/`](file:///Users/aarvik/Documents/123/terraform/gcp).

---

## 🗄️ Step 1: Create GCP Cloud Storage (GCS) Bucket for Remote State Backend

Run the following `gcloud` CLI commands to create the GCS bucket for remote state storage:

```bash
# 1. Set environment variables
export PROJECT_ID=$(gcloud config get-value project)
export GCS_BUCKET_NAME="tfstate-finops-gcp-$RANDOM"
export LOCATION="us-east1"

# 2. Create GCS Bucket for Terraform State
gcloud storage buckets create gs://$GCS_BUCKET_NAME \
    --project=$PROJECT_ID \
    --location=$LOCATION \
    --uniform-bucket-level-access

# 3. Enable Object Versioning
gcloud storage buckets update gs://$GCS_BUCKET_NAME --versioning

echo "================================================================="
echo "  ✓ GCP GCS Remote State Bucket Created Successfully!"
echo "  • Bucket URI: gs://$GCS_BUCKET_NAME"
echo "================================================================="
```

---

## ⚡ Step 2: Provision GKE Infrastructure via Terraform

```bash
cd terraform/gcp

# Initialize Terraform with Remote GCS Backend
terraform init \
    -backend-config="bucket=$GCS_BUCKET_NAME" \
    -backend-config="prefix=gke/state"

# Review execution plan
terraform plan

# Apply infrastructure configuration
terraform apply -auto-approve
```

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-gke-context.md)**
