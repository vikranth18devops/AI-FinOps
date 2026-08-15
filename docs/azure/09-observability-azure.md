# 09 - Observability Stack on Azure AKS (Prometheus + Grafana + Loki)

## 📌 Step Overview
Deploy full observability tooling inside namespace `observability` to monitor cluster health, pod performance metrics, and centralized log streams.

---

## ⚡ 1. Install Prometheus Operator & Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo update

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
  -f chart/monitoring/prometheus-values.yaml \
  --wait
```

---

## ⚡ 2. Install Loki & Promtail Log Aggregator

```bash
helm repo add grafana https://grafana.github.io/helm-charts --force-update
helm repo update

helm upgrade --install loki grafana/loki-stack \
  --namespace observability \
  -f chart/monitoring/loki-values.yaml \
  --wait
```

---

## 📊 Grafana Access Information

- **URL**: `http://<GRAFANA_LOADBALANCER_IP>:3000`
- **Username**: `admin`
- **Password**: `SecureGrafanaPassword2026!`

---

Next Step: **[10-PostgreSQL Validation & Connection Testing](10-postgresql-validation-azure.md)**
