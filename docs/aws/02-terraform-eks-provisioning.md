# 02 - Terraform EKS Infrastructure Provisioning

## 📌 Step Overview
In this step, you will provision cloud infrastructure on AWS using modular **Terraform** code located in `terraform/aws/`.

The Terraform workflow provisions:
1. **AWS VPC** (`10.0.0.0/16`) and Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`).
2. **Internet Gateway** for outbound/inbound traffic.
3. **AWS Elastic Kubernetes Service (EKS)** cluster (`finops-eks-cluster`) with `t3.xlarge` managed node groups.
4. **Remote State Backend**: State is stored in an AWS S3 Bucket (`finops-aws-tfstate-2026`) with DynamoDB state locking (`finops-tfstate-locks`).

---

## ⚡ Execution Steps

```bash
# Navigate to AWS terraform directory
cd terraform/aws

# Initialize Terraform modules & remote S3 backend
terraform init

# Review execution plan
terraform plan

# Apply infrastructure configuration
terraform apply -auto-approve

# Export cluster name variable
export EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
cd ../..
```

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-eks-context.md)**
