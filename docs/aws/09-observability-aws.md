# 09 - Observability & Logging Stack on AWS EKS (Prometheus + Grafana + Loki + Tempo + Alertmanager)

<p align="left">
  <img src="https://img.shields.io/badge/Prometheus-Monitoring-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  <img src="https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Loki-Logging-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Tempo-Tracing-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_EKS-Observability-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
</p>

## 📌 Step Overview
Deploy a production-grade observability and log aggregation stack to AWS EKS — **Prometheus** (metrics), **Grafana** (dashboards), **Alertmanager** (alerts), **Loki** (log store), **Tempo** (distributed tracing), and **OpenTelemetry Collector** (OTLP ingestion).

Expose Grafana, Prometheus, and Alertmanager UIs cleanly under sub-paths of your domain **`http://vikranthsunkarpally.in/`**:
- **Grafana Dashboards**: `http://vikranthsunkarpally.in/grafana/`
- **Prometheus Metric Explorer**: `http://vikranthsunkarpally.in/prometheus/`
- **Alertmanager Alerts**: `http://vikranthsunkarpally.in/alertmanager/`
- **Log & Trace Correlation**: Container logs from all pods streamed to Loki, traces to Tempo, queryable inside Grafana.

---

## 🏗️ Architecture & Component Layout

```text
   finops services (OTLP :4317)           Prometheus scrapes /metrics
            │                                        ▲
            ▼                                        │  (ServiceMonitor)
   ┌──────────────────┐    traces     ┌─────────────┴──────────────┐
   │  OTel Collector  │ ───────────►  │   observability namespace   │
   │  (OTLP receiver) │    metrics    │  Prometheus + Alertmanager  │
   └──────────────────┘ ───────────►  │  Grafana · Loki · Tempo     │
                                       │  Promtail (DaemonSet)       │
   pod stdout ──Promtail──► Loki ─────►│                             │
                                       └─────────────┬──────────────┘
                                                     ▼
                                            Grafana dashboards
                                     (metrics ↔ logs ↔ traces linked)
```

| Concern | Tool | Why |
|---|---|---|
| **Metrics** | Prometheus + Alertmanager | De-facto standard; Prometheus Operator converts `ServiceMonitor` CRDs into scrape configs. |
| **Dashboards / Alerts UI** | Grafana | Single pane of glass for metrics, logs, and traces with cross-signal link correlation. |
| **Logs** | Loki + Promtail | Promtail streams container stdout; Loki indexes by label for fast in-cluster querying. |
| **Traces** | Tempo | Lightweight trace store queried directly inside Grafana. |
| **Ingestion** | OTel Collector | Receives OTLP telemetry from microservices and routes metrics/spans to Tempo and Prometheus. |

---

## ⚡ Step 1: Add Helm Repositories & Install Stack

### 1a. Create Namespaces & Add Helm Repos
```bash
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```

### 1b. Deploy `kube-prometheus-stack` (Metrics + Grafana + Alertmanager)
```bash
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
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

### 1c. Deploy `loki-stack` (Log Aggregation)
```bash
# Release name MUST be "loki" or "loki-stack" so Grafana datasource matches
helm upgrade --install loki grafana/loki-stack \
  --namespace logging \
  --set promtail.enabled=true \
  --set 'promtail.config.lokiAddress=http://logging-loki:3100/loki/api/v1/push' \
  --set grafana.enabled=false \
  --wait
```

### 1d. Deploy Tempo (Tracing)
```bash
helm upgrade --install tempo grafana/tempo \
  --namespace observability \
  --wait --timeout=5m
```

Verify all observability pods on EKS:
```bash
kubectl get pods -n observability
kubectl get pods -n logging
```

---

## ⚡ Step 2: Configure Traefik IngressRoutes for Observability UIs

Expose Grafana, Prometheus, and Alertmanager under `http://vikranthsunkarpally.in/`:

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

### 🔑 Access Credentials & Password Management:
- **Grafana Dashboard**: `http://vikranthsunkarpally.in/grafana/`  
  - **Username**: `admin`  
  - **Retrieve Admin Password Command**:  
    ```bash
    kubectl -n observability get secret prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo
    ```
- **Prometheus UI**: `http://vikranthsunkarpally.in/prometheus/`
- **Alertmanager UI**: `http://vikranthsunkarpally.in/alertmanager/`

#### Reset Grafana Password via CLI:
```bash
GRAFANA_POD=$(kubectl get pod -n observability -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $GRAFANA_POD -n observability -c grafana -- grafana-cli admin reset-admin-password "YourNewSecretPassword123!"
```

---

## ⚡ Step 3: Configure ServiceMonitor for Application Metrics Scraping

Apply a `ServiceMonitor` resource in namespace `finops` so Prometheus automatically scrapes `/metrics` endpoints across microservices:

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

## ⚡ Step 4: Configure Alerting Rules (`PrometheusRule` CRD)

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
| Grafana UI asset paths return 404 | Service name mismatch in Ingress | Ensure Ingress points to `name: prometheus-grafana` on port 80 and `serve_from_sub_path=true`. |
| Promtail logs flood with `lookup logging: no such host` | Default Loki service name mismatch | Set `promtail.config.lokiAddress` explicitly to `http://logging-loki:3100/loki/api/v1/push`. |
| Prometheus shows 0 targets under `finops` | `serviceMonitorSelector` mismatch | Ensure `ServiceMonitor` carries label `release: prometheus` and targets port name `http`. |
| Loki logs panel empty | Service name release mismatch | Confirm Loki release name is `loki` or `loki-stack` and service matches Grafana datasource URL. |

---

Next Step: **[10-HTTPS TLS with Let's Encrypt & Path-Routed Sub-Apps](10-https-letsencrypt-aws.md)**
