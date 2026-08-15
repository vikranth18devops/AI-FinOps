# 🚀 AI-Powered Multi-Cloud FinOps & Infrastructure Optimization Platform

<p align="center">
  <img src="https://img.shields.io/badge/Microsoft_Azure-AKS-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_AWS-EKS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-GKE-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/ArgoCD-GitOps-EF6B48?style=for-the-badge&logo=argo&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/HTTPS-Let's_Encrypt-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white" />
</p>

An enterprise-grade, multi-cloud FinOps and Cloud Cost Intelligence platform. It scans cloud infrastructure across **Azure**, **AWS**, and **GCP**, detects over-provisioned resources, calculates estimated dollar savings, and automates remediation via custom UI scripts, ArgoCD GitOps continuous delivery, and full observability tooling.

---

## 🌐 Custom Domain & Single-Point Routing Architecture

The entire platform is exposed over **HTTPS** on custom domain **`vikranthsunkarpally.in`** via **Traefik v3 Ingress** and **cert-manager** (Let's Encrypt production TLS certificates):

- 📱 **React Dashboard UI**: [`https://vikranthsunkarpally.in/`](https://vikranthsunkarpally.in/)
- ⚙️ **FastAPI Backend API**: [`https://vikranthsunkarpally.in/api/`](https://vikranthsunkarpally.in/api/)
- 🚀 **UI_Script Provisioner**: [`https://vikranthsunkarpally.in/studio`](https://vikranthsunkarpally.in/studio)
- 🔄 **ArgoCD GitOps Controller**: [`https://vikranthsunkarpally.in/argocd/`](https://vikranthsunkarpally.in/argocd/)
- 📊 **Grafana Observability**: [`https://vikranthsunkarpally.in/grafana/`](https://vikranthsunkarpally.in/grafana/)
- 📈 **Prometheus Explorer**: [`https://vikranthsunkarpally.in/prometheus/`](https://vikranthsunkarpally.in/prometheus/)
- 🚨 **Alertmanager UI**: [`https://vikranthsunkarpally.in/alertmanager/`](https://vikranthsunkarpally.in/alertmanager/)

---

## 🏗️ 3-Tier Microservice Architecture Stack

```text
                                  [Internet]
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │ Traefik Ingress LoadBalancer │
                      │ vikranthsunkarpally.in       │
                      └──────────────┬───────────────┘
                                     │  Ingress Path Routing (TLS)
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
   / (Frontend)               /api (Backend)              /studio (UI_Script)
        │                            │                            │
        ▼                            ▼                            ▼
  ┌───────────┐                ┌───────────┐                ┌───────────┐
  │  React    │                │  FastAPI  │                │ UI_Script │
  │ Dashboard │                │    API    │                │ Studio    │
  │ (Port 80) │                │(Port 8000)│                │(Port 8500)│
  └───────────┘                └─────┬─────┘                └───────────┘
                                     │
                                     ▼  In-Cluster DNS: postgres-service:5432
                               ┌───────────┐
                               │PostgreSQL │
                               │StatefulSet│
                               └───────────┘
```

| Microservice Component | Technology Stack | Local Dev Port | Production Container Target |
| :--- | :--- | :--- | :--- |
| **Frontend Dashboard** | React (Vite + TypeScript + Tailwind) | `5173` | `finops-frontend-service:80` |
| **Backend API** | Python (FastAPI + asyncpg + JWT) | `8000` | `finops-backend-service:8000` |
| **UI_Script Studio** | Python (FastAPI + Provisioner Engine) | `8500` | `finops-ui-script-service:8500` |
| **In-Cluster Database** | PostgreSQL 15 StatefulSet (`postgres-0`) | `5432` | `postgres-service.finops.svc.cluster.local:5432` |

---

## 📚 Multi-Cloud Step-by-Step Deployment Guides (13 Steps Each)

Complete, 13-step production deployment documentation is available for each cloud provider:

- 🔷 **[Azure AKS Documentation Guide](docs/azure/README.md)** (Steps 01 - 13)
- 🟧 **[AWS EKS Documentation Guide](docs/aws/README.md)** (Steps 01 - 13)
- 🟩 **[GCP GKE Documentation Guide](docs/gcp/README.md)** (Steps 01 - 13)

---

## ⚡ 1-Click Launchers & Automated Scripts

### 1. Simultaneous Local Microservices Stack Launcher
Run all 3 microservices locally from workspace root:
```bash
./start_local.sh
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- UI_Script Studio: `http://localhost:8500`

### 2. Automated Cloud Infrastructure Deployment Scripts
- **Azure AKS**: `./deploy-azure.sh`
- **AWS EKS**: `./deploy-aws.sh`
- **GCP GKE**: `./deploy-gcp.sh`

---

## 🛡️ Key Features & Detection Engines
- **Idle / Unattached Disk Cleanup**: Detects unattached EBS / Azure Managed / GKE Disks.
- **Over-Provisioned VM & Node Sizing**: Flags CPU/memory underutilization and provides automated resize commands.
- **In-Cluster PostgreSQL StatefulSet**: Saves $100+/month by eliminating managed database cloud surcharges.
- **ArgoCD GitOps Sync**: Real-time cluster state reconciliation driven by GitHub pushes.
- **Full Observability Stack**: Centralized log streaming via Loki & Promtail; metrics scraping via Prometheus ServiceMonitors; Grafana dashboards.
