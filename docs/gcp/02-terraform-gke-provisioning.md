# 02 - Terraform GKE Provisioning

<p align="left">
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/GCP-GKE_Cluster-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>

## 📌 Step Overview
Provision the GCP VPC Network, Subnets, and GKE Kubernetes Cluster using modular Terraform templates located in [`terraform/gcp/`](file:///Users/aarvik/Documents/123/terraform/gcp).

---

## ⚡ Execution Steps

```bash
cd terraform/gcp

# Initialize Terraform modules
terraform init

# Validate configuration syntax
terraform validate

# Review execution plan
terraform plan

# Provision GKE infrastructure
terraform apply -auto-approve
```

---

## 📊 Provisioned Resources
- 🌐 **VPC Network**: `finops-gcp-vpc`
- 🔀 **Subnets**: `finops-gcp-subnet` (Primary IP range + Secondary Pods & Services ranges)
- ☸️ **GKE Cluster**: `finops-gke-cluster` (Auto-scaling node pool)

---

Next Step: **[03-Kubectl GKE Context Setup](03-kubectl-gke-context.md)**
