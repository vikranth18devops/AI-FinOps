# 🔐 Remote Terraform State Storage (`tfstate`) Setup Guide

This guide explains how remote `tfstate` storage and state locking are configured across **Azure**, **AWS**, and **GCP**.

---

## 🟦 1. Azure Blob Storage Remote `tfstate`

In `terraform/azure/main.tf`:
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "finopstfstate2026"
    container_name       = "tfstate"
    key                  = "azure.aks.tfstate"
  }
}
```

### Setup Command (Run once in Azure CLI):
```bash
# Create Resource Group & Storage Account for tfstate
az group create --name tfstate-rg --location eastus
az storage account create --name finopstfstate2026 --resource-group tfstate-rg --sku Standard_LRS --encryption-services blob
az storage container create --name tfstate --account-name finopstfstate2026
```

---

## 🟧 2. AWS S3 + DynamoDB Remote `tfstate`

In `terraform/aws/main.tf`:
```hcl
terraform {
  backend "s3" {
    bucket         = "finops-aws-tfstate-2026"
    key            = "aws/eks/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "finops-tfstate-locks"
    encrypt        = true
  }
}
```

### Setup Command (Run once in AWS CLI):
```bash
# Create S3 bucket for tfstate
aws s3api create-bucket --bucket finops-aws-tfstate-2026 --region us-east-1

# Enable versioning & encryption
aws s3api put-bucket-versioning --bucket finops-aws-tfstate-2026 --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name finops-tfstate-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
```

---

## 🟩 3. GCP GCS Bucket Remote `tfstate`

In `terraform/gcp/main.tf`:
```hcl
terraform {
  backend "gcs" {
    bucket = "finops-gcp-tfstate-2026"
    prefix = "gcp/gke"
  }
}
```

### Setup Command (Run once in GCP CLI):
```bash
# Create GCS Bucket for tfstate
gcloud storage buckets create gs://finops-gcp-tfstate-2026 --location=us-central1
gcloud storage buckets update gs://finops-gcp-tfstate-2026 --versioning
```

---

### 🚀 Initializing Remote State

Once the bucket/container is created, navigate to your target cloud terraform folder and run:

```bash
terraform init
```
*Terraform will automatically connect to your remote backend and store your `.tfstate` file securely in the cloud with state locking!*
