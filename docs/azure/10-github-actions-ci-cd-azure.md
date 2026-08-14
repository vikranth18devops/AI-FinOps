# 10 - GitHub Actions CI/CD Pipeline for Azure AKS

The dedicated Azure AKS CI/CD pipeline is defined in [`.github/workflows/ci-cd-azure.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-azure.yml):

- Authenticates to Azure Container Registry (ACR) via `azure/docker-login`.
- Builds & pushes `backend`, `frontend`, and `ui_script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization.

---

Next Step: **[11-PostgreSQL Validation on Azure](11-postgresql-validation-azure.md)**
