# 12 - GitHub Actions CI/CD Pipeline for GCP GKE

The dedicated GCP GKE CI/CD pipeline is defined in [`.github/workflows/ci-cd-gcp.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-gcp.yml):

- Authenticates to Google Artifact Registry (AR) via `google-github-actions/auth`.
- Builds & pushes `backend`, `frontend`, and `ui_script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization on GKE.

---

Next Step: **[13-One-Click GCP Deployment](13-one-click-gcp-deploy.md)**
