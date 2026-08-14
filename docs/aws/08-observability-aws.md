# 08 - Observability Stack on AWS EKS

## 📌 Prometheus & Grafana Monitoring

Monitors cluster health and scrapes application metrics from:
- `finops-backend-service:8000/metrics`
- `finops-ui-script-service:8500/metrics`

---

## ⚡ Deployment & ServiceMonitor Setup

```bash
kubectl apply -f chart/monitoring/servicemonitor-ui-script.yaml -n finops
```

---

Next Step: **[09-One-Click AWS Deployment Script](09-one-click-aws-deploy.md)**
