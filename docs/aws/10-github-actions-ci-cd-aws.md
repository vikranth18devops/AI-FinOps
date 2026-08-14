# 10 - GitHub Actions CI/CD Pipeline for AWS EKS

The dedicated AWS EKS CI/CD pipeline is defined in [`.github/workflows/ci-cd-aws.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd-aws.yml):

- Authenticates to Amazon ECR via `aws-actions/amazon-ecr-login`.
- Builds & pushes `finops-backend`, `finops-frontend`, and `finops-ui-script` container images.
- Automatically updates `chart/values.yaml` image tags for ArgoCD GitOps synchronization.

---

Next Step: **[11-PostgreSQL Validation on AWS](11-postgresql-validation-aws.md)**
