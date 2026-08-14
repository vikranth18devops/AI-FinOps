# 08 - Observability Stack on GKE

<p align="left">
  <img src="https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  <img src="https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Loki-Logging-5294E2?style=for-the-badge&logo=grafana&logoColor=white" />
</p>

## 📌 Prometheus & Grafana Monitoring

Monitors cluster health and scrapes application metrics from:
- ⚙️ `finops-backend-service:8000/metrics` (Port 8080 local)
- 🚀 `finops-ui-script-service:8500/metrics` (Port 8585 local)

---

## ⚡ Deployment & ServiceMonitor Setup

```bash
kubectl apply -f chart/monitoring/servicemonitor-ui-script.yaml -n finops
```

---

Next Step: **[09-One-Click GCP Deployment Script](09-one-click-gcp-deploy.md)**
