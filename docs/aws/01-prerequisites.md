# 01 - Prerequisites & Local Tools Installation Guide for AWS EKS

<p align="left">
  <img src="https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Secrets-CI%2FCD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" />
  <img src="https://img.shields.io/badge/EKS-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
</p>

## 📌 Local CLI Tools Installation Guide (macOS, Linux, Windows)

To execute AWS provisioner scripts (`create_aws_resources.sh`), manage EKS Kubernetes clusters, and run local microservices (`./start_local.sh`), install the following local CLI tools:

---

### 1️⃣ AWS CLI v2
Required for AWS resource provisioning, ECR login, and CLI authentication.

#### 🍏 macOS (Homebrew)
```bash
brew install awscli
```

#### 🐧 Linux (Debian / Ubuntu)
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

#### 🔑 Local AWS Authentication
```bash
# Configure AWS Access Keys
aws configure
```

---

### 2️⃣ Kubernetes CLI (`kubectl`) & `eksctl`
Required to inspect pods and manage AWS EKS clusters.

```bash
# macOS
brew install kubectl eksctl
```

---

### 3️⃣ Terraform CLI (v1.5+)
Required to execute infrastructure-as-code modules under [`terraform/aws/`](file:///Users/aarvik/Documents/123/terraform/aws).

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

---

### 4️⃣ Helm 3 (Package Manager for Kubernetes)
Required to deploy application Helm charts under [`chart/`](file:///Users/aarvik/Documents/123/chart).

```bash
brew install helm
```

---

### 5️⃣ Docker Desktop
Required for local container image builds (`Dockerfile`).

```bash
brew install --cask docker
```

---

## 🚀 Microservice Architecture Stack

The application stack consists of 3 microservices located in [`application/`](file:///Users/aarvik/Documents/123/application):
- 📱 **React Frontend**: `application/frontend` (Port 3000)
- ⚙️ **FastAPI Backend**: `application/backend` (Port 8080)
- 🚀 **UI_Script Provisioner**: `application/UI_Script` (Port 8585)

Launch all 3 local microservices simultaneously:
```bash
./start_local.sh
```

---

## 🔐 How to Obtain & Set AWS GitHub Secrets (`ci-cd-aws.yml`)

The AWS EKS CI/CD pipeline requires 3 GitHub Repository Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

Follow the step-by-step instructions below to generate each secret:

### 1️⃣ Obtain AWS Credentials from IAM User
```bash
aws configure get aws_access_key_id
aws configure get aws_secret_access_key
aws configure get region
```

---

### 2️⃣ Adding Secrets to GitHub Repository
1. Open your GitHub Repository: **`https://github.com/vikranth18devops/AI-FinOps`**
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add each secret:

| Secret Name | Value to Paste |
| :--- | :--- |
| **`AWS_ACCESS_KEY_ID`** | Your AWS Access Key ID (e.g. `AKIAIOSFODNN7EXAMPLE`) |
| **`AWS_SECRET_ACCESS_KEY`** | Your AWS Secret Access Key |
| **`AWS_REGION`** | `us-east-1` (or your chosen AWS region) |

---

Next Step: **[02-Terraform EKS Provisioning](02-terraform-eks-provisioning.md)**
