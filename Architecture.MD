# 🏛️ AI Cloud Cost Detective - Enterprise Multi-Cloud Architecture

```text
                                     ┌──────────────┐
                                     │     USER     │
                                     └──────┬───────┘
                                            │
                                            ▼ HTTPS (Port 443 / TLS)
                          ┌───────────────────────────────────┐
                          │     TRAEFIK INPRESS LOADBALANCER  │
                          │      vikranthsunkarpally.in       │
                          └─────────────────┬─────────────────┘
                                            │  Path Routing
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
        ▼                                   ▼                                   ▼
   / (Frontend)                      /api (Backend)                     /studio (UI_Script)
        │                                   │                                   │
        ▼                                   ▼                                   ▼
┌───────────────────┐               ┌───────────────────┐               ┌───────────────────┐
│  REACT FRONTEND   │               │  PYTHON BACKEND   │               │ UI_SCRIPT STUDIO  │
│    (Port 5173)    │               │ (FastAPI - 8000)  │               │ (FastAPI - 8500)  │
└───────────────────┘               └─┬───────┬───────┬─┘               └───────────────────┘
                                      │       │       │
                       ┌──────────────┘       │       └──────────────┐
                       │                      │                      │
                       ▼                      ▼                      ▼
                ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
                │  CLOUD CLIs │        │  WEBSOCKET  │        │   OPENAI    │
                │ az/aws/gcloud│       │  Progress   │        │   GPT-4o    │
                └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
                       │                      │                      │
                       ▼                      ▼                      ▼
                ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
                │ MULTI-CLOUD │        │    REACT    │        │ IN-CLUSTER  │
                │ Azure/AWS/  │        │  PROGRESS   │        │ POSTGRESQL  │
                │     GCP     │        │   TRACKER   │        │ StatefulSet │
                └─────────────┘        └─────────────┘        └─────────────┘
```

## 🏗️ Architectural Core Principles

1. **Multi-Cloud Native Scanning**: Directly invokes `az`, `aws`, and `gcloud` CLIs asynchronously to inspect live cloud resource states across Azure Resource Groups, AWS VPCs, and GCP Projects.
2. **In-Cluster Database Storage**: Deploys a Kubernetes `PostgreSQL 15` StatefulSet with persistent disk PVCs (`10Gi`) inside namespace `finops` to store user authentication, cost investigations, and remediation execution logs ($ Saved to Date).
3. **Single Domain Path-Based Routing**: Traefik v3 Ingress terminates TLS certificates managed by `cert-manager` (Let's Encrypt) and path-routes all platform sub-apps (`/`, `/api`, `/studio`, `/argocd/`, `/grafana/`, `/prometheus/`, `/alertmanager/`) under `https://vikranthsunkarpally.in`.
4. **GitOps Continuous Delivery Loop**: Integrates ArgoCD to continuously reconcile Kubernetes manifests in `chart/` against GitHub pushes.
