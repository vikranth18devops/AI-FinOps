# 🗺️ Master Sequential Implementation Roadmap
## AI Cloud Cost Detective & FinOps Intelligence Platform

Follow this strictly ordered, step-by-step implementation roadmap to deploy the platform to Kubernetes (Azure AKS, AWS EKS, GCP GKE).

---

## 📌 Master Implementation Execution Order

```
[01. Prerequisites] ➡️ [02. Remote tfstate] ➡️ [03. Terraform Infra] ➡️ [04. Kubectl Context]
                                                                                |
[08. Helm Services] ⬅️ [07. Traefik Ingress] ⬅️ [06. PostgreSQL DB]  ⬅️ [05. Namespaces]
        |
        v
[09. Observability] ➡️ [10. GitHub Actions] ➡️ [11. Postgres Validation]
```

---

## 📑 Cloud-Specific Implementation Guides

Select your target cloud provider below for the complete sorted implementation guide:

### 🟦 1. Microsoft Azure AKS Implementation Guide
👉 **[Azure AKS Execution Roadmap](azure/README.md)**
1. `01-prerequisites.md`: Azure CLI, sign-in, and provider registration.
2. `02-terraform-aks-provisioning.md`: Provision Azure VNet & AKS Cluster.
3. `03-kubectl-aks-context.md`: Connect `kubectl` context to AKS.
4. `04-namespaces-and-rbac.md`: Create `finops` & `observability` namespaces.
5. `05-in-cluster-postgresql.md`: Deploy in-cluster PostgreSQL StatefulSet.
6. `06-traefik-ingress-azure.md`: Deploy Traefik LoadBalancer Ingress.
7. `07-helm-app-deployment-azure.md`: Deploy React Frontend & FastAPI Backend via Helm.
8. `08-observability-azure.md`: Deploy Prometheus, Grafana, and Loki.
9. `09-one-click-azure-deploy.md`: Automated `./deploy-azure.sh` execution.
10. `10-github-actions-ci-cd-azure.md`: GitHub Actions workflow for ACR & AKS.
11. `11-postgresql-validation-azure.md`: Validate in-cluster PostgreSQL StatefulSet database & tables.

---

### 🟧 2. Amazon Web Services EKS Implementation Guide
👉 **[AWS EKS Execution Roadmap](aws/README.md)**
1. `01-prerequisites.md`: AWS CLI and credentials configuration.
2. `02-terraform-eks-provisioning.md`: Provision AWS VPC & EKS Cluster.
3. `03-kubectl-eks-context.md`: Connect `kubectl` context to EKS.
4. `04-namespaces-and-rbac.md`: Create `finops` & `observability` namespaces.
5. `05-in-cluster-postgresql.md`: Deploy in-cluster PostgreSQL StatefulSet.
6. `06-traefik-ingress-aws.md`: Deploy Traefik Network LoadBalancer Ingress.
7. `07-helm-app-deployment-aws.md`: Deploy React Frontend & FastAPI Backend via Helm.
8. `08-observability-aws.md`: Deploy Prometheus, Grafana, and Loki.
9. `09-one-click-aws-deploy.md`: Automated `./deploy-aws.sh` execution.
10. `10-github-actions-ci-cd-aws.md`: GitHub Actions workflow for ECR & EKS.
11. `11-postgresql-validation-aws.md`: Validate in-cluster PostgreSQL StatefulSet database & tables.

---

### 🟩 3. Google Cloud Platform GKE Implementation Guide
👉 **[GCP GKE Execution Roadmap](gcp/README.md)**
1. `01-prerequisites.md`: gcloud SDK, project setup, and API enablement.
2. `02-terraform-gke-provisioning.md`: Provision GCP VPC & GKE Autopilot Cluster.
3. `03-kubectl-gke-context.md`: Connect `kubectl` context to GKE.
4. `04-namespaces-and-rbac.md`: Create `finops` & `observability` namespaces.
5. `05-in-cluster-postgresql.md`: Deploy in-cluster PostgreSQL StatefulSet.
6. `06-traefik-ingress-gcp.md`: Deploy Traefik LoadBalancer Ingress.
7. `07-helm-app-deployment-gcp.md`: Deploy React Frontend & FastAPI Backend via Helm.
8. `08-observability-gcp.md`: Deploy Prometheus, Grafana, and Loki.
9. `09-one-click-gcp-deploy.md`: Automated `./deploy-gcp.sh` execution.
10. `10-github-actions-ci-cd-gcp.md`: GitHub Actions workflow for GCR/GAR & GKE.
11. `11-postgresql-validation-gcp.md`: Validate in-cluster PostgreSQL StatefulSet database & tables.

---

## ⚡ Quick One-Click Automated Deployment
```bash
./deploy.sh
```
