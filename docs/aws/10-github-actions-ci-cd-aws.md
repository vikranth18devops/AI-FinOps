# 10 - GitHub Actions CI/CD Pipeline for AWS EKS

The CI/CD pipeline defined in [`.github/workflows/ci-cd.yml`](file:///Users/aarvik/Documents/123/.github/workflows/ci-cd.yml) builds and pushes Docker images for `backend`, `frontend`, and `ui_script`:

```yaml
- name: Build & Push UI_Script Provisioner Docker Image
  run: |
    docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/ui_script:${{ github.sha }} -f ./application/UI_Script/Dockerfile .
    docker push ${{ secrets.ACR_LOGIN_SERVER }}/ui_script:${{ github.sha }}
```

---

Next Step: **[11-PostgreSQL Validation on AWS](11-postgresql-validation-aws.md)**
