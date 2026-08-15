# 12 - GitHub Actions CI/CD Pipeline for AWS EKS

The dedicated AWS EKS CI/CD pipeline is defined in [`.github/workflows/ci-cd-aws.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-aws.yml):

- Authenticates to Amazon Elastic Container Registry (ECR) via `aws-actions/amazon-ecr-login`.
- Builds & pushes `backend`, `frontend`, and `ui_script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization on EKS.

---

Next Step: **[13-One-Click AWS Deployment](13-one-click-aws-deploy.md)**
