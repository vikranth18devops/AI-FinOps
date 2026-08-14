#!/usr/bin/env bash
set -e

echo "================================================================="
echo " 🚀 ONE-CLICK DEPLOYMENT: GOOGLE KUBERNETES ENGINE (GKE)"
echo " Application + K8s PostgreSQL DB + Prometheus + Grafana + Loki"
echo "================================================================="

# 1. Provision Infrastructure via Terraform
echo "[1/7] Provisioning GCP VPC & GKE Autopilot Cluster via Terraform..."
cd terraform/gcp
terraform init
terraform apply -auto-approve
CLUSTER_NAME=$(terraform output -raw gke_cluster_name)
cd ../..

# 2. Get GKE Credentials for kubectl
echo "[2/7] Connecting kubectl to GCP GKE Cluster '$CLUSTER_NAME'..."
gcloud container clusters get-credentials "$CLUSTER_NAME" --region us-central1

# 3. Create Namespaces
kubectl create namespace finops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -

# 4. Install Traefik Ingress Controller
echo "[3/7] Installing Traefik Ingress Controller via Helm..."
helm repo add traefik https://traefik.github.io/charts --force-update
helm repo update
helm upgrade --install traefik traefik/traefik \
  --namespace ingress-traefik --create-namespace \
  --set ports.web.redirectTo=websecure \
  --wait

# 5. Install Prometheus & Grafana Monitoring Stack
echo "[4/7] Installing Prometheus Operator & Grafana via Helm..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo update
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
  -f chart/monitoring/prometheus-values.yaml \
  --wait

# 6. Install Loki & Promtail Log Aggregator Stack
echo "[5/7] Installing Loki & Promtail Centralized Log Stack via Helm..."
helm repo add grafana https://grafana.github.io/helm-charts --force-update
helm repo update
helm upgrade --install loki grafana/loki-stack \
  --namespace observability \
  -f chart/monitoring/loki-values.yaml \
  --wait

# 7. Deploy Unified Application & In-Cluster Database Helm Chart
echo "[6/7] Deploying Application & In-Cluster DB via Helm Chart..."
helm upgrade --install finops ./chart \
  --namespace finops \
  --wait

# 8. Health Verification & Credentials Summary
echo "[7/7] Verifying Deployment Health..."
kubectl get pods -n finops
kubectl get pods -n observability

echo "================================================================="
echo " ✅ ONE-CLICK DEPLOYMENT COMPLETED SUCCESSFULLY ON GCP GKE!"
echo " In-Cluster DB: postgres-service.finops.svc.cluster.local:5432"
echo " Traefik LoadBalancer External IP:"
kubectl get svc -n ingress-traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' || echo " Fetching IP..."
echo ""
echo " 📊 GRAFANA MONITORING DASHBOARD:"
echo " URL: http://$(kubectl get svc -n observability prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo 'FETCHING_IP'):3000"
echo " Username: admin"
echo " Password: SecureGrafanaPassword2026!"
echo "================================================================="
