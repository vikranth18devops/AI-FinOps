# 01 - Prerequisites & GitHub Secrets Setup for GCP GKE

## 📌 Prerequisites Checklist

Before deploying the AI Cloud Cost Detective microservices stack to GCP GKE, ensure the following tools are installed and configured:

1. **Google Cloud SDK (`gcloud`)**: Installed and authenticated (`gcloud auth login`).
2. **Terraform (v1.5+)**: Installed for GCP VPC & GKE cluster provisioning.
3. **kubectl**: Configured to interact with Kubernetes clusters (`gcloud container clusters get-credentials`).
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
*Copy the returned Project ID string (e.g., `my-finops-project-123456`).*

---

### 2️⃣ Obtain `GCP_REGION`
Choose your target Google Cloud region where Artifact Registry and GKE reside:
- Common regions: `us-central1`, `europe-west1`, `asia-east1`
*Value to enter in GitHub Secrets*: `us-central1`

---

### 3️⃣ Generate `GCP_SA_KEY` (Service Account Key)
Run the following commands in your terminal to create a dedicated Service Account with Artifact Registry & GKE permissions, and download the JSON key:

```bash
# 1. Set your active GCP Project ID variable
export PROJECT_ID=$(gcloud config get-value project)

# 2. Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com container.googleapis.com

# 3. Create Artifact Registry Repository (if not existing)
gcloud artifacts repositories create finops-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for AI FinOps platform"

# 4. Create a dedicated GitHub Actions Service Account
gcloud iam service-accounts create github-actions-sa \
    --display-name="GitHub Actions CI/CD Service Account"

# 5. Grant Artifact Registry & Kubernetes Engine permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.admin"

# 6. Generate & download the JSON Key file
gcloud iam service-accounts keys create gcp-key.json \
    --iam-account=github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com

# 7. Print the JSON key content to copy into GitHub Secrets
cat gcp-key.json
```

---

### 4️⃣ Adding Secrets to GitHub Repository
1. Open your GitHub Repository: **`https://github.com/vikranth18devops/AI-FinOps`**
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add each secret:

| Secret Name | Value to Paste |
| :--- | :--- |
| **`GCP_PROJECT_ID`** | Output of `gcloud config get-value project` |
| **`GCP_REGION`** | `us-central1` (or your GCP region) |
| **`GCP_SA_KEY`** | Full raw JSON content from `cat gcp-key.json` |

4. Clean up the local key file after setting the secret:
```bash
rm gcp-key.json
```

---

Next Step: **[02-Terraform GKE Provisioning](02-terraform-gke-provisioning.md)**
