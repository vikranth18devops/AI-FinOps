# 10 - GitHub Actions CI/CD Pipeline for GCP GKE

<p align="left">
  <img src="https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" />
  <img src="https://img.shields.io/badge/GCP-Artifact_Registry-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>

## 📌 Step Overview

The dedicated GCP GKE CI/CD pipeline is defined in [`.github/workflows/ci-cd-gcp.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-gcp.yml):

- Authenticates to GCP Artifact Registry via `google-github-actions/auth`.
- Builds & pushes `backend`, `frontend`, and `ui_script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization.

---

Next Step: **[11-PostgreSQL Validation on GCP](11-postgresql-validation-gcp.md)**
