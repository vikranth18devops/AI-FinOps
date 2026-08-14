# 08 - Observability Stack on GCP GKE

Deploy **Prometheus**, **Grafana**, and **Loki + Promtail** to monitor GKE cluster health.

---

## ⚡ Deployment Commands

```bash
# Prometheus Operator & Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo update
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
  -f chart/monitoring/prometheus-values.yaml \
  --wait

# Loki & Promtail
helm repo add grafana https://grafana.github.io/helm-charts --force-update
helm repo update
helm upgrade --install loki grafana/loki-stack \
  --namespace observability \
  -f chart/monitoring/loki-values.yaml \
  --wait
```

---

Next Step: **[09-One-Click GCP Deployment](09-one-click-gcp-deploy.md)**
