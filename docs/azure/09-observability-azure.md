# 09 - Observability & Logging Stack on Azure AKS (Prometheus + Grafana + Loki + Alertmanager)

<p align="left">
  <img src="https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  <img src="https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Loki-Logging-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure_AKS-Observability-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
</p>

## 📌 Step Overview
Add a production-grade observability and log aggregation stack to Azure AKS — **Prometheus** (metrics), **Grafana** (dashboards), **Alertmanager** (alerts), **Loki** (log store), and **Promtail** (log shipper).

Expose Grafana, Prometheus, and Alertmanager UIs cleanly under sub-paths of your domain **`http://vikranthsunkarpally.in/`**:
- **Grafana Dashboards**: `http://vikranthsunkarpally.in/grafana/`
- **Prometheus Metric Explorer**: `http://vikranthsunkarpally.in/prometheus/`
- **Alertmanager Alerts**: `http://vikranthsunkarpally.in/alertmanager/`
- **Log Aggregation**: Container logs from all pods streamed to Loki and queryable inside Grafana.

---

## 🏗️ Architecture & Component Layout

```text
                                  [Internet]
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │ Traefik LoadBalancer (AKS)   │
                      │ vikranthsunkarpally.in       │
                      └──────────────┬───────────────┘
                                     │  IngressRoutes (sub-paths)
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
   /grafana/                    /prometheus/                /alertmanager/
        │                            │                            │
        ▼                            ▼                            ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │ Namespace: observability                                                │
   │  ┌──────────┐            ┌────────────┐            ┌────────────┐       │
   │  │ Grafana  │            │ Prometheus │            │Alertmanager│       │
   │  │          │            │ (10Gi PVC) │            │ (5Gi PVC)  │       │
   │  └────┬─────┘            └─────▲──────┘            └────────────┘       │
   │       │                        │ scrape                             │
   │       │                        │ (ServiceMonitor CRDs)              │
   │       │                  ┌─────┴─────────────────────────────┐       │
   │       │                  │ Microservice Pods (/metrics)      │       │
   │       │                  └───────────────────────────────────┘       │
   │       │ datasource                                                   │
   │       ▼                                                              │
   │  ┌──────────┐                                                        │
   │  │   Loki   │ ◀── Promtail (DaemonSet) tails container logs           │
   │  │(10Gi PVC)│     on every AKS node                                  │
   │  └──────────┘                                                        │
   │ Namespace: logging                                                   │
   └──────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Step 1: Install Prometheus, Grafana & Alertmanager (`kube-prometheus-stack`)

Install the `kube-prometheus-stack` chart into the `observability` namespace with sub-path routing enabled for domain `vikranthsunkarpally.in`:

```bash
# 1. Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo update

# 2. Deploy kube-prometheus-stack
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability --create-namespace \
  --set fullnameOverride=kube-prometheus \
  --set grafana.enabled=true \
  --set grafana.ingress.enabled=false \
  --set 'grafana.grafana\.ini.server.domain=vikranthsunkarpally.in' \
  --set 'grafana.grafana\.ini.server.root_url=http://vikranthsunkarpally.in/grafana/' \
  --set 'grafana.grafana\.ini.server.serve_from_sub_path=true' \
  --set 'prometheus.prometheusSpec.routePrefix=/prometheus' \
  --set 'prometheus.prometheusSpec.externalUrl=http://vikranthsunkarpally.in/prometheus' \
  --set 'prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false' \
  --set 'alertmanager.alertmanagerSpec.routePrefix=/alertmanager' \
  --set 'alertmanager.alertmanagerSpec.externalUrl=http://vikranthsunkarpally.in/alertmanager' \
  --wait --timeout=5m
```

Verify pod health:
```bash
kubectl get pods -n observability
```

---

## ⚡ Step 2: Install Loki & Promtail Log Aggregator (`loki-stack`)

Install Loki and Promtail in the `logging` namespace to collect and index container logs across all AKS worker nodes:

```bash
# 1. Add Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts --force-update
helm repo update

# 2. Deploy loki-stack with Promtail lokiAddress override
helm upgrade --install loki grafana/loki-stack \
  --namespace logging --create-namespace \
  --set promtail.enabled=true \
  --set 'promtail.config.lokiAddress=http://logging-loki:3100/loki/api/v1/push' \
  --set grafana.enabled=false \
  --wait
```

Verify logging pods:
```bash
kubectl get pods -n logging
```

---

## ⚡ Step 3: Configure Traefik IngressRoutes for Observability UIs

Apply Traefik Ingress routes to expose `/grafana`, `/prometheus`, and `/alertmanager` under `vikranthsunkarpally.in`:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: observability-ingress
  namespace: observability
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
spec:
  ingressClassName: traefik
  rules:
    - host: vikranthsunkarpally.in
      http:
        paths:
          - path: /grafana
            pathType: Prefix
            backend:
              service:
                name: prometheus-grafana
                port:
                  number: 80
          - path: /prometheus
            pathType: Prefix
            backend:
              service:
                name: kube-prometheus-prometheus
                port:
                  number: 9090
          - path: /alertmanager
            pathType: Prefix
            backend:
              service:
                name: kube-prometheus-alertmanager
                port:
                  number: 9093
EOF
```

### Access Credentials:
- **Grafana Dashboard**: `http://vikranthsunkarpally.in/grafana/`  
  - **Username**: `admin`  
  - **Retrieve Password Command**:  
    ```bash
    kubectl -n observability get secret prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo
    ```
- **Prometheus UI**: `http://vikranthsunkarpally.in/prometheus/`
- **Alertmanager UI**: `http://vikranthsunkarpally.in/alertmanager/`

---

## ⚡ Step 4: Configure ServiceMonitor for Application Metrics Scraping

Apply a `ServiceMonitor` resource in namespace `finops` so Prometheus automatically scrapes `/metrics` endpoints across backend services:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: finops-services-monitor
  namespace: finops
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames:
      - finops
  selector:
    matchLabels:
      app.kubernetes.io/part-of: finops
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
      scrapeTimeout: 10s
EOF
```

Verify target discovery in Prometheus:
```bash
curl -s "http://vikranthsunkarpally.in/prometheus/api/v1/query?query=up%7Bnamespace%3D%22finops%22%7D" | python3 -m json.tool
```

---

## ⚡ Step 5: Configure Alerting Rules (`PrometheusRule` CRD)

Apply alerting rules to monitor high error rates, pod restarts, and database downtime:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: finops-alert-rules
  namespace: finops
  labels:
    release: prometheus
spec:
  groups:
    - name: finops.alerts
      rules:
        - alert: FinOpsHighErrorRate
          expr: sum(rate(http_requests_total{namespace="finops", status=~"5.."}[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High 5xx HTTP error rate detected on FinOps backend"
        - alert: FinOpsPostgresDown
          expr: kube_pod_container_status_ready{namespace="finops", pod="postgres-0"} == 0
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "In-cluster PostgreSQL database pod is unreachable"
EOF
```

---

## 📊 Useful PromQL Diagnostic Queries

Open **`http://vikranthsunkarpally.in/prometheus/`** to run PromQL queries:

| Diagnostic Target | PromQL Query |
| :--- | :--- |
| **All Active Scrape Targets** | `up{namespace="finops"}` |
| **Request Rate (RPS) per Microservice** | `sum by (service) (rate(http_requests_total{namespace="finops"}[5m]))` |
| **HTTP 5xx Error Rate** | `sum by (service) (rate(http_requests_total{namespace="finops", status=~"5.."}[5m]))` |
| **95th Percentile Response Latency (s)** | `histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket{namespace="finops"}[5m])))` |
| **CPU Usage per Pod (Cores)** | `sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="finops", container!="POD", container!=""}[5m]))` |
| **Working-Set Memory Usage per Pod (MB)** | `sum by (pod) (container_memory_working_set_bytes{namespace="finops", container!="POD", container!=""}) / 1024 / 1024` |
| **Active Firing Alerts** | `ALERTS{alertstate="firing"}` |

---

## 🛠️ Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| Grafana UI asset paths return 404 | Missing `serve_from_sub_path` | Ensure `grafana.ini.server.root_url` is set to `http://vikranthsunkarpally.in/grafana/`. |
| Promtail logs flood with `lookup logging: no such host` | Default Loki service name mismatch | Set `promtail.config.lokiAddress` explicitly to `http://logging-loki:3100/loki/api/v1/push`. |
| Prometheus shows 0 targets under `finops` | `serviceMonitorSelector` mismatch | Ensure `ServiceMonitor` carries label `release: prometheus` and targets port name `http`. |

---

Next Step: **[10-HTTPS TLS with Let's Encrypt & Path-Routed Sub-Apps](10-https-letsencrypt-azure.md)**
