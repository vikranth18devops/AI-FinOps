# 01 - Prerequisites & Local Tools Installation Guide for GCP GKE

<p align="left">
  <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Secrets-CI%2FCD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" />
  <img src="https://img.shields.io/badge/GKE-Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
</p>

> [!IMPORTANT]
> **GCP Billing Requirement**: Ensure billing is enabled on your GCP project before creating Artifact Registry repositories or GKE clusters. You can enable billing at: `https://console.developers.google.com/billing/enable?project=YOUR_PROJECT_ID`

---

## 📌 Local CLI Tools Installation Guide (macOS, Linux, Windows)

To execute GCP provisioner scripts (`create_gcp_resources.sh`), manage GKE Kubernetes clusters, and run local microservices (`./start_local.sh`), install the following local CLI tools:

---

### 1️⃣ Google Cloud SDK (`gcloud` CLI) & GKE Auth Plugin
The Google Cloud SDK is required for `gcloud` commands and GCP authentication.

#### 🍏 macOS (Homebrew)
```bash
# Install Google Cloud SDK
brew install --cask google-cloud-sdk

# Install GKE kubectl Authentication Plugin (Required for Kubernetes)
gcloud components install gke-gcloud-auth-plugin
```

#### 🐧 Linux (Debian / Ubuntu)
```bash
# Add Google Cloud SDK distribution URI as a package source
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Install SDK and GKE plugin
sudo apt-get update && sudo apt-get install -y google-cloud-cli google-cloud-cli-gke-gcloud-auth-plugin
```

#### 🔑 Local GCP Authentication
```bash
# Login to Google Cloud User Account
gcloud auth login

# Login for Application Default Credentials (ADC)
gcloud auth application-default login

# Set Default GCP Project ID
gcloud config set project <YOUR_GCP_PROJECT_ID>
```

---

### 2️⃣ Kubernetes CLI (`kubectl`)
Required to inspect pods, deployments, and services running on GKE.

```bash
# macOS
brew install kubectl

# Or via gcloud
gcloud components install kubectl
```

---

### 3️⃣ Terraform CLI (v1.5+)
Required to execute infrastructure-as-code modules under [`terraform/gcp/`](file:///Users/aarvik/Documents/123/terraform/gcp).

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform -version
```

---

### 4️⃣ Helm 3 (Package Manager for Kubernetes)
Required to deploy application Helm charts under [`chart/`](file:///Users/aarvik/Documents/123/chart).

```bash
# macOS
brew install helm

# Verify installation
helm version
```

---

### 5️⃣ Docker Desktop
Required for local container image builds (`Dockerfile`).

```bash
# macOS
brew install --cask docker

# Verify Docker engine is running
docker info
```

---

### 6️⃣ Python 3.11+ & Node.js 20+
Required to launch local microservices stack via `./start_local.sh`.

```bash
# macOS
brew install python@3.11 node@20
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

## 🔐 How to Obtain & Set GCP GitHub Secrets (`ci-cd-gcp.yml`)

The GCP GKE CI/CD pipeline requires 3 GitHub Repository Secrets:
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SA_KEY`

Follow the step-by-step instructions below to generate each secret:

### 1️⃣ Obtain `GCP_PROJECT_ID`
Run the following command in your terminal to get your active Google Cloud Project ID:
```bash
gcloud config get-value project
```
*Example Output*: `project-ca7436f0-33ea-4575-ada`

---

### 2️⃣ Obtain `GCP_REGION`
Choose your target Google Cloud region where Artifact Registry and GKE reside:
- Common regions: `us-central1`, `europe-west1`, `asia-east1`
*Value to enter in GitHub Secrets*: `us-central1`

---

### 3️⃣ Generate `GCP_SA_KEY` (Service Account Key)
Run the following commands in your terminal:

```bash
# 1. Set active GCP Project ID variable
export PROJECT_ID=$(gcloud config get-value project)

# 2. Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com container.googleapis.com

# 3. Create Artifact Registry Repository (Ensure billing is enabled)
gcloud artifacts repositories create finops-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for AI FinOps platform"

# 4. Create dedicated GitHub Actions Service Account
gcloud iam service-accounts create github-actions-sa \
    --display-name="GitHub Actions CI/CD Service Account"

# 5. Grant Artifact Registry Writer & Kubernetes Engine Admin roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.admin"

# 6. Generate & download JSON Key file
gcloud iam service-accounts keys create gcp-key.json \
    --iam-account=github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com

# 7. Print JSON key content to copy into GitHub Secrets
cat gcp-key.json
```

---

### 4️⃣ Adding Secrets to GitHub Repository
1. Open your GitHub Repository: **`https://github.com/vikranth18devops/AI-FinOps`**
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add each secret:

| Secret Name | How to Get Value | Example Output Value |
| :--- | :--- | :--- |
| **`GCP_PROJECT_ID`** | Run `gcloud config get-value project` | `project-ca7436f0-33ea-4575-ada` |
| **`GCP_REGION`** | Preferred GCP Region | `us-central1` |
| **`GCP_SA_KEY`** | Output of `cat gcp-key.json` | `{ "type": "service_account", ... }` |

4. Clean up local key file for security:
```bash
rm gcp-key.json
```

---

Next Step: **[02-Terraform GKE Provisioning](02-terraform-gke-provisioning.md)**
