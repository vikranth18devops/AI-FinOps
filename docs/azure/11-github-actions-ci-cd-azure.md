# 11 - GitHub Actions CI/CD Pipeline for Azure AKS

The dedicated Azure AKS CI/CD pipeline is defined in [`.github/workflows/ci-cd-azure.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-azure.yml):

- Authenticates to Azure Container Registry (ACR) via `azure/docker-login`.
- Builds & pushes `backend`, `frontend`, and `ui_script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization on AKS.

---

Next Step: **[12-One-Click Azure Deployment](12-one-click-azure-deploy.md)**
