# 10 - GitHub Actions CI/CD Pipeline for GCP GKE

Automate building, pushing Docker container images to **Google Artifact Registry (GAR) / GCR**, and updating Helm chart deployments to **GKE Autopilot**.

---

## 🏗️ Workflow Architecture

```
[Developer Push to main]
          |
          v
[GitHub Actions CI Runner]
          |
          +---> 1. Authenticate to GCP via Workload Identity (google-github-actions/auth)
          +---> 2. Setup Google Cloud SDK (google-github-actions/setup-gcloud)
          +---> 3. Build & Push Backend Image -> gcr.io/<gcp_project_id>/backend:<SHA>
          +---> 4. Build & Push Frontend Image -> gcr.io/<gcp_project_id>/frontend:<SHA>
          +---> 5. Update Helm values.yaml with new GAR Image Tags
          +---> 6. Trigger ArgoCD GitOps Sync to GKE
```

---

## 🔑 GitHub Secrets Configuration

Before enabling the pipeline, add these secrets in your GitHub Repository under **Settings -> Secrets and variables -> Actions**:

| Secret Name | Description / Example Value |
| :--- | :--- |
| **`GCP_PROJECT_ID`** | Your Google Cloud Project ID |
| **`GCP_SA_KEY`** | Google Cloud Service Account JSON Key |
| **`GCR_REGISTRY`** | `gcr.io/<GCP_PROJECT_ID>` |

---

## 📜 GitHub Actions Pipeline Workflow (`.github/workflows/gcp-ci-cd.yml`)

```yaml
name: GCP GKE CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository Code
        uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker for Google Container Registry
        run: gcloud auth configure-docker --quiet

      - name: Build & Push Backend Image to GCR
        run: |
          docker build -t ${{ secrets.GCR_REGISTRY }}/backend:${{ github.sha }} ./application/backend
          docker push ${{ secrets.GCR_REGISTRY }}/backend:${{ github.sha }}

      - name: Build & Push Frontend Image to GCR
        run: |
          docker build -t ${{ secrets.GCR_REGISTRY }}/frontend:${{ github.sha }} ./application/frontend
          docker push ${{ secrets.GCR_REGISTRY }}/frontend:${{ github.sha }}

      - name: Update Helm Chart Image Tags
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          sed -i 's/backendTag:.*/backendTag: "${{ github.sha }}"/' chart/values.yaml
          sed -i 's/frontendTag:.*/frontendTag: "${{ github.sha }}"/' chart/values.yaml
          git add chart/values.yaml
          git commit -m "Bump GCP image tags to ${{ github.sha }} [skip ci]"
          git push
```
