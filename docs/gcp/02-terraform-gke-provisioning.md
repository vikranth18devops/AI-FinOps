# 02 - Terraform GKE Infrastructure Provisioning

## 📌 Step Overview
Provision cloud infrastructure on GCP using modular **Terraform** code located in `terraform/gcp/`.

The Terraform workflow provisions:
1. **GCP VPC Network** (`finops-gcp-vpc`) and Subnet (`10.10.0.0/16`).
2. **GKE Autopilot Cluster** (`finops-gke-cluster`) in `us-central1`.
3. **Remote State Backend**: State is stored in a GCS Bucket (`finops-gcp-tfstate-2026`).

---

## ⚡ Execution Steps

```bash
# Navigate to GCP terraform directory
cd terraform/gcp

# Initialize Terraform modules & remote GCS backend
terraform init

# Review execution plan
terraform plan

# Apply infrastructure configuration
terraform apply -auto-approve

# Export cluster name variable
export GKE_CLUSTER_NAME=$(terraform output -raw gke_cluster_name)
cd ../..
```

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-gke-context.md)**
