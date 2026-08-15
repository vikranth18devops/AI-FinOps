# 🗺️ Master Multi-Cloud Implementation Roadmap (Azure, AWS & GCP)

<p align="center">
  <img src="https://img.shields.io/badge/Microsoft_Azure-AKS-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_AWS-EKS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-GKE-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>

Follow this strictly ordered, 13-step implementation roadmap to deploy the platform to Kubernetes across **Azure AKS**, **AWS EKS**, or **GCP GKE**.

---

## 📌 Master 13-Step Implementation Execution Roadmap

```text
[01. Prerequisites] ──► [02. Terraform Infra] ──► [03. Kubectl Context] ──► [04. Namespaces & RBAC]
                                                                                      │
[08. GoDaddy DNS] ◄── [07. ArgoCD GitOps] ◄── [06. Traefik Ingress] ◄── [05. PostgreSQL DB]
        │
        ▼
[09. Observability] ──► [10. HTTPS Let's Encrypt] ──► [11. Postgres Test] ──► [12. GitHub Actions] ──► [13. 1-Click Deploy]
```

---

## 📑 Cloud-Specific Implementation Guides

Select your target cloud provider below for the complete 13-step execution guide:

### 🟦 1. Microsoft Azure AKS Implementation Guide
👉 **[Azure AKS Execution Roadmap](azure/README.md)** *(Steps 01 through 13)*

### 🟧 2. Amazon Web Services EKS Implementation Guide
👉 **[AWS EKS Execution Roadmap](aws/README.md)** *(Steps 01 through 13)*

### 🟩 3. Google Cloud Platform GKE Implementation Guide
👉 **[GCP GKE Execution Roadmap](gcp/README.md)** *(Steps 01 through 13)*

---

## 🌐 Single-Point HTTPS Routing (`vikranthsunkarpally.in`)
- **React Dashboard UI**: `https://vikranthsunkarpally.in/`
- **ArgoCD GitOps**: `https://vikranthsunkarpally.in/argocd/`
- **Grafana Dashboards**: `https://vikranthsunkarpally.in/grafana/`
- **Prometheus Explorer**: `https://vikranthsunkarpally.in/prometheus/`
- **Alertmanager UI**: `https://vikranthsunkarpally.in/alertmanager/`
