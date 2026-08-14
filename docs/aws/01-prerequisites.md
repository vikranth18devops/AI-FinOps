# 01 - Prerequisites & GitHub Secrets Setup for AWS EKS

## 📌 Prerequisites Checklist

Before deploying the AI Cloud Cost Detective microservices stack to AWS EKS, ensure the following tools are installed and configured:

1. **AWS CLI v2**: Installed and authenticated (`aws sts get-caller-identity`).
2. **Terraform (v1.5+)**: Installed for AWS VPC & EKS cluster provisioning.
3. **kubectl**: Configured to interact with Kubernetes clusters.
4. **Helm (v3.10+)**: Installed for chart deployments.
5. **Docker**: Running locally to build `backend`, `frontend`, and `ui_script` container images.

---

## 🚀 Microservice Architecture Stack

The application stack consists of 3 microservices located in [`application/`](file:///Users/aarvik/Documents/123/application):
- **React Frontend**: `application/frontend` (Port 3000)
- **FastAPI Backend**: `application/backend` (Port 8080)
- **UI_Script Provisioner**: `application/UI_Script` (Port 8585)

Local Simultaneous Launcher:
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
Run the following commands in your terminal or check `~/.aws/credentials`:

```bash
# Print current AWS Access Key ID
aws configure get aws_access_key_id

# Print current AWS Secret Access Key
aws configure get aws_secret_access_key

# Print current AWS Region
aws configure get region
```

If creating a new IAM user for CI/CD:
1. Open **AWS IAM Console** > **Users** > **Create User** (name: `github-actions-user`).
2. Attach Policy: `AmazonEC2ContainerRegistryFullAccess` & `AmazonEKSClusterPolicy`.
3. Create **Access Key** under **Security credentials** tab and copy `Access Key ID` & `Secret Access Key`.

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
