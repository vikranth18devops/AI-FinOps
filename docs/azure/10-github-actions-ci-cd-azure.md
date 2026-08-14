# 10 - GitHub Actions CI/CD Pipeline for Azure AKS

Automate building, pushing Docker container images to **Azure Container Registry (ACR)**, and updating Helm chart deployments to **Azure Kubernetes Service (AKS)**.

---

## 🏗️ Workflow Architecture

```
[Developer Push to main]
          |
          v
[GitHub Actions CI Runner]
          |
          +---> 1. Authenticate to Azure ACR (azure/docker-login@v1)
          +---> 2. Build & Push Backend Image -> myacr.azurecr.io/backend:<SHA>
          +---> 3. Build & Push Frontend Image -> myacr.azurecr.io/frontend:<SHA>
          +---> 4. Update Helm values.yaml with new Image Tags
          +---> 5. Trigger ArgoCD GitOps Sync to AKS
```

---

## 🔑 GitHub Secrets Configuration

Before enabling the pipeline, add these 3 secrets in your GitHub Repository under **Settings -> Secrets and variables -> Actions**:

| Secret Name | Description / Example Value |
| :--- | :--- |
| **`ACR_LOGIN_SERVER`** | `myfinopsacr2026.azurecr.io` |
| **`ACR_USERNAME`** | Azure Container Registry Service Principal / Admin Username |
| **`ACR_PASSWORD`** | Azure Container Registry Password |

---

## 📜 GitHub Actions Pipeline Workflow (`.github/workflows/azure-ci-cd.yml`)

```yaml
name: Azure AKS CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository Code
        uses: actions/checkout@v3

      - name: Log in to Azure Container Registry (ACR)
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build & Push Backend Image to ACR
        run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/backend:${{ github.sha }} ./application/backend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/backend:${{ github.sha }}

      - name: Build & Push Frontend Image to ACR
        run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/frontend:${{ github.sha }} ./application/frontend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/frontend:${{ github.sha }}

      - name: Update Helm Chart Image Tags
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          sed -i 's/backendTag:.*/backendTag: "${{ github.sha }}"/' chart/values.yaml
          sed -i 's/frontendTag:.*/frontendTag: "${{ github.sha }}"/' chart/values.yaml
          git add chart/values.yaml
          git commit -m "Bump Azure image tags to ${{ github.sha }} [skip ci]"
          git push
```
