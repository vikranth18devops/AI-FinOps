# 04 - Create Kubernetes Namespaces & Workload Identity RBAC on GKE

## 📌 Step Overview
In this step, you will isolate cluster workloads by creating dedicated Kubernetes namespaces (`finops`, `observability`, `logging`, `ingress-traefik`, `argocd`, and `cert-manager`) and setting up Google Cloud Workload Identity and Role-Based Access Control (RBAC) security guardrails.

---

## ⚡ 1. Create Workload Namespaces

```bash
# Create application workload namespace
kubectl create namespace finops --dry-run=client -o yaml | kubectl apply -f -

# Create monitoring & log aggregation namespace
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -

# Create logging namespace
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

# Create ingress controller namespace
kubectl create namespace ingress-traefik --dry-run=client -o yaml | kubectl apply -f -

# Create ArgoCD GitOps namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Create cert-manager TLS controller namespace
kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -
```

---

## 🛡️ 2. Apply In-Cluster RBAC ServiceAccount

Apply the read-only ServiceAccount binding for FastAPI backend inspection:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: finops-backend-sa
  namespace: finops
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: finops-read-only-role
rules:
  - apiGroups: [""]
    resources: ["pods", "nodes", "namespaces"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: finops-backend-rb
subjects:
  - kind: ServiceAccount
    name: finops-backend-sa
    namespace: finops
roleRef:
  kind: ClusterRole
  name: finops-read-only-role
  apiGroup: rbac.authorization.k8s.io
EOF
```

---

## 🔍 Verification

List created namespaces:
```bash
kubectl get namespaces
```

---

Next Step: **[05-In-Cluster PostgreSQL StatefulSet](05-in-cluster-postgresql.md)**
