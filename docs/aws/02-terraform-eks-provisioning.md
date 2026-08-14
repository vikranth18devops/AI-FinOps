# 02 - Terraform EKS Infrastructure Provisioning & Remote State Setup

<p align="left">
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_AWS-S3_Bucket-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/EKS-Cluster_Provisioning-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Step Overview
In this step, you will setup the AWS S3 & DynamoDB remote state backend and provision cloud infrastructure on AWS using modular **Terraform** code located in [`terraform/aws/`](file:///Users/aarvik/Documents/123/terraform/aws).

---

## 🗄️ Step 1: Create AWS S3 Bucket & DynamoDB Table for Remote State Backend

Run the following AWS CLI commands to create the S3 bucket and DynamoDB lock table for remote state storage:

```bash
# 1. Set environment variables
export S3_BUCKET_NAME="tfstate-finops-aws-$RANDOM"
export DYNAMODB_TABLE_NAME="tfstate-locks"
export AWS_REGION="us-east-1"

# 2. Create S3 Bucket for Terraform State
aws s3api create-bucket \
    --bucket $S3_BUCKET_NAME \
    --region $AWS_REGION

# 3. Enable Versioning on S3 Bucket
aws s3api put-bucket-versioning \
    --bucket $S3_BUCKET_NAME \
    --versioning-configuration Status=Enabled

# 4. Create DynamoDB Table for State Locking
aws dynamodb create-table \
    --table-name $DYNAMODB_TABLE_NAME \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION

echo "================================================================="
echo "  ✓ AWS S3 Remote State Backend Created Successfully!"
echo "  • S3 Bucket:       $S3_BUCKET_NAME"
echo "  • DynamoDB Table:  $DYNAMODB_TABLE_NAME"
echo "================================================================="
```

---

## ⚡ Step 2: Provision EKS Infrastructure via Terraform

```bash
cd terraform/aws

# Initialize Terraform with Remote Backend
terraform init \
    -backend-config="bucket=$S3_BUCKET_NAME" \
    -backend-config="key=aws.eks.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="dynamodb_table=$DYNAMODB_TABLE_NAME"

# Review execution plan
terraform plan

# Apply infrastructure configuration
terraform apply -auto-approve
```

---

Next Step: **[03-Connect Kubectl Context](03-kubectl-eks-context.md)**
