# 10 - HTTPS TLS with Let's Encrypt & Path-Routed Sub-Apps (GCP GKE)

<p align="left">
  <img src="https://img.shields.io/badge/Cert_Manager-v1.15.3-0089D6?style=for-the-badge&logo=cert-manager&logoColor=white" />
  <img src="https://img.shields.io/badge/Let's_Encrypt-Production_TLS-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white" />
  <img src="https://img.shields.io/badge/Traefik-HTTPS_Websecure-24A1DE?style=for-the-badge&logo=traefik&logoColor=white" />
</p>

## 📌 Step Overview
Install **cert-manager**, mint a free **Let's Encrypt** production TLS certificate for your domain **`vikranthsunkarpally.in`**, switch Traefik Ingress to the **HTTPS (`websecure`)** entryPoint, and secure all 5 platform UIs:

```text
https://vikranthsunkarpally.in                — FinOps React Frontend Dashboard
https://vikranthsunkarpally.in/argocd         — ArgoCD Continuous Delivery UI
https://vikranthsunkarpally.in/grafana        — Grafana Observability Dashboards
https://vikranthsunkarpally.in/prometheus     — Prometheus Metric Explorer
https://vikranthsunkarpally.in/alertmanager   — Alertmanager Alert Rules UI
```

---

## 🏗️ Architecture & Certificate Workflow

```text
        ┌──────────────────────────────────────────────────────────┐
        │  cert-manager (namespace: cert-manager)                  │
        │   ┌─────────────────────────────────────────────┐        │
        │   │  ClusterIssuer: letsencrypt-prod            │        │
        │   └─────────────────────────────────────────────┘        │
        │                        │                                 │
        │                        ▼                                 │
        │   Certificate: finops-tls (namespace: finops)            │
        │   → Generates Secret: finops-tls                         │
        └────────────────────────┬─────────────────────────────────┘
                                 │ (Copied to argocd & observability)
                                 ▼
        Traefik Ingress (entryPoints: websecure, port 443)
        Secret: finops-tls  ──►  🔒 Trusted HTTPS TLS Encryption!
```

---

## ⚡ Step 1: Install cert-manager Control Plane

Install `cert-manager` using its official Helm chart in the `cert-manager` namespace:

```bash
# 1. Add and update Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io --force-update
helm repo update jetstack

# 2. Install cert-manager with CustomResourceDefinitions (CRDs)
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true \
  --set replicaCount=2 \
  --set global.leaderElection.namespace=cert-manager \
  --wait --timeout=5m
```

Verify that all 3 cert-manager pods reach `Running` state:
```bash
kubectl get pods -n cert-manager
```

---

## ⚡ Step 2: Deploy Let's Encrypt Production `ClusterIssuer`

Deploy the ACME HTTP-01 `ClusterIssuer` pointing to Let's Encrypt production API:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: vikranth.devops18@gmail.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: traefik
EOF
```

Verify ClusterIssuer status:
```bash
kubectl get clusterissuer letsencrypt-prod
```
> Expected Status: `READY: True`

---

## ⚡ Step 3: Issue Let's Encrypt TLS Certificate for `vikranthsunkarpally.in`

Create the `Certificate` resource inside namespace `finops`:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: finops-tls
  namespace: finops
spec:
  secretName: finops-tls
  duration: 2160h                        # 90 days
  renewBefore: 360h                      # Auto-renew 15 days prior to expiry
  privateKey:
    algorithm: ECDSA
    size: 256
    rotationPolicy: Always
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
    group: cert-manager.io
  commonName: vikranthsunkarpally.in
  dnsNames:
    - vikranthsunkarpally.in
EOF
```

Watch issuance progress (typically takes 30-60 seconds):
```bash
kubectl get certificate finops-tls -n finops -w
```

Inspect TLS certificate details:
```bash
kubectl get secret finops-tls -n finops -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -issuer -dates
```
> Expected Output: `issuer=C=US, O=Let's Encrypt, CN=R10` (or `R11`)

---

## ⚡ Step 4: Propagate TLS Secret to `argocd` and `observability` Namespaces

Duplicate the minted `finops-tls` secret so Traefik can terminate HTTPS for ArgoCD and Observability dashboards:

```bash
# Duplicate TLS Secret to observability namespace
kubectl get secret finops-tls -n finops -o yaml \
  | sed 's/namespace: finops/namespace: observability/' \
  | kubectl apply -f -

# Duplicate TLS Secret to argocd namespace
kubectl get secret finops-tls -n finops -o yaml \
  | sed 's/namespace: finops/namespace: argocd/' \
  | kubectl apply -f -
```

Verify copied secrets:
```bash
kubectl get secret finops-tls -n observability
kubectl get secret finops-tls -n argocd
```

---

## ⚡ Step 5: Switch Traefik Ingress Routes to HTTPS (`websecure`)

Update Ingress resources across all namespaces to use `ingressClassName: traefik` with TLS secret `finops-tls`:

### 5a. FinOps Microservices Ingress (HTTPS)
```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finops-ingress
  namespace: finops
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - vikranthsunkarpally.in
      secretName: finops-tls
  rules:
    - host: vikranthsunkarpally.in
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: finops-backend-service
                port:
                  number: 8000
          - path: /studio
            pathType: Prefix
            backend:
              service:
                name: finops-ui-script-service
                port:
                  number: 8500
          - path: /
            pathType: Prefix
            backend:
              service:
                name: finops-frontend-service
                port:
                  number: 80
EOF
```

### 5b. ArgoCD Ingress (HTTPS)
```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - vikranthsunkarpally.in
      secretName: finops-tls
  rules:
    - host: vikranthsunkarpally.in
      http:
        paths:
          - path: /argocd
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 80
EOF
```

---

## ⚡ Step 6: Configure HTTP to HTTPS Permanent Redirect (308)

Configure a catch-all Middleware and Ingress Route on HTTP port 80 to automatically redirect plain HTTP requests to HTTPS:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-to-https
  namespace: finops
spec:
  redirectScheme:
    scheme: https
    permanent: true
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: http-to-https-redirect
  namespace: finops
spec:
  entryPoints:
    - web
  routes:
    - match: HostRegexp(\`.+\`)
      kind: Rule
      priority: 1
      middlewares:
        - name: redirect-to-https
      services:
        - name: finops-frontend-service
          port: 80
EOF
```

---

## 🔍 Step 7: Verify All 5 Endpoints Over HTTPS

Execute `curl` tests against all HTTPS endpoints:

```bash
export DOMAIN="vikranthsunkarpally.in"

echo "=== Verifying HTTPS Endpoints ==="
curl -sI "https://${DOMAIN}/"                       | head -1
curl -sIL "https://${DOMAIN}/argocd/"               | head -1
curl -sIL "https://${DOMAIN}/grafana/login"         | head -1
curl -sIL "https://${DOMAIN}/prometheus/-/ready"    | head -1
curl -sL  "https://${DOMAIN}/alertmanager/-/ready"
```
> All endpoints should return **`HTTP/2 200`** with a trusted SSL padlock 🔒 icon in your browser!

---

## 🧹 Infrastructure Teardown Checklist

When destroying all resources at the end of testing:

```bash
# 1. Uninstall Helm releases
helm uninstall finops -n finops --ignore-not-found
helm uninstall argocd -n argocd --ignore-not-found
helm uninstall traefik -n ingress-traefik --ignore-not-found
helm uninstall cert-manager -n cert-manager --ignore-not-found

# 2. Delete Persistent Volume Claims (PVCs)
kubectl delete pvc --all -n finops
kubectl delete pvc --all -n observability
kubectl delete pvc --all -n logging

# 3. Destroy GCP Infrastructure via Terraform
cd /Users/aarvik/Documents/123/terraform/gcp
terraform destroy -auto-approve
```

---

## 🛠️ Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| Certificate stuck `READY: False` | Port 80 blocked upstream | Ensure HTTP port 80 is reachable from public internet so Let's Encrypt can solve HTTP-01 challenge. |
| Browser shows `NET::ERR_CERT_AUTHORITY_INVALID` | Request hitting raw IP instead of domain | Access endpoints using domain `https://vikranthsunkarpally.in/` instead of IP. |
| Rate-limited by Let's Encrypt (5 certs/week) | Repeated certificate recreations | Use Let's Encrypt staging URL (`https://acme-staging-v02.api.letsencrypt.org/directory`) during testing. |

---

Next Step: **[11-PostgreSQL Validation & Connection Testing](11-postgresql-validation-gcp.md)**
