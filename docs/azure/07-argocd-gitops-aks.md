# 07 - ArgoCD GitOps Continuous Deployment Setup on AKS

<p align="left">
  <img src="https://img.shields.io/badge/ArgoCD-GitOps-EF6B48?style=for-the-badge&logo=argo&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-AKS-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Helm-v3-0F1689?style=for-the-badge&logo=helm&logoColor=white" />
</p>

## 📌 Step Overview
Deploy the complete FinOps application stack (**React Frontend**, **FastAPI Backend**, **UI_Script Provisioner Studio**, and **In-Cluster PostgreSQL**) using an automated **GitOps continuous delivery loop** powered by **ArgoCD** on Azure AKS.

After completing this phase, any commit pushed to `main` (or image tag update by GitHub Actions) is automatically detected by ArgoCD, which synchronizes the cluster in real time without manual `helm upgrade` or `kubectl apply` commands!

```
[Developer Push / GitHub Action CI]
               │
               ▼
[GitHub Repo: vikranth18devops/AI-FinOps]
               │
               ▼ (Polling / Webhook)
      [ArgoCD Controller]
               │
               ▼ (Automated Sync & Rollout)
      [Azure AKS Cluster (finops namespace)]
```

---

## ⚡ Step 1: Clean Up Pre-Existing Standalone Resources

If standalone PostgreSQL or manual Helm releases were deployed previously, clean them up so ArgoCD can take total ownership of the application stack without resource conflicts:

```bash
# 1. Clean up standalone PostgreSQL resources from Step 05
kubectl delete secret postgres-secret -n finops --ignore-not-found
kubectl delete service postgres-service -n finops --ignore-not-found
kubectl delete statefulset postgres -n finops --ignore-not-found

# 2. Uninstall any manual Helm release if present
helm uninstall finops -n finops --ignore-not-found
```

> [!NOTE]
> **What Survives Cleanup**:
> - PostgreSQL PersistentVolumeClaim (`postgres-data-postgres-0`) and storage volume remain **intact**.
> - Namespace `finops` remains active.
> - When ArgoCD syncs the StatefulSet, PostgreSQL re-attaches to existing PVCs without data loss!

---

## ⚡ Step 2: Install ArgoCD Control Plane

Install ArgoCD using its official Helm chart into the `argocd` namespace:

```bash
# 1. Add and update ArgoCD Helm Repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update argo

# 2. Install ArgoCD Server
helm install argocd argo/argo-cd \
  --namespace argocd --create-namespace \
  --set server.service.type=ClusterIP \
  --set 'configs.params.server\.insecure=true' \
  --set 'configs.params.server\.rootpath=/argocd' \
  --wait --timeout=5m
```

Verify that all ArgoCD pods reach `Running` state:
```bash
kubectl get pods -n argocd
```

---

## ⚡ Step 3: Expose ArgoCD UI via Traefik Ingress (`/argocd` path)

Create a standard Kubernetes `Ingress` in the `argocd` namespace to route traffic through your existing Traefik Ingress LoadBalancer:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
spec:
  ingressClassName: traefik
  rules:
    - http:
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

### Get ArgoCD Initial Admin Credentials
```bash
# 1. Fetch Traefik Public LoadBalancer IP & Print ArgoCD URL
export TRAEFIK_IP=$(kubectl get svc -n ingress-traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "ARGOCD_URL: http://${TRAEFIK_IP}/argocd/"

# 2. Retrieve initial admin password
export ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d)
echo "ARGOCD_PASSWORD: ${ARGOCD_PASSWORD}"

# 3. Print ArgoCD Access Details
echo "================================================="
echo "  ✓ ArgoCD Exposed Successfully!"
echo "  • Access URL: http://${TRAEFIK_IP}/argocd/"
echo "  • Username:   admin"
echo "  • Password:   ${ARGOCD_PASSWORD}"
echo "================================================="
```

---

## ⚡ Step 4: Register GitHub Repository in ArgoCD

Register your GitHub repository credentials inside the `argocd` namespace so ArgoCD can poll for chart updates:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: finops-repo-secret
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: https://github.com/vikranth18devops/AI-FinOps.git
EOF
```

---

## ⚡ Step 5: Deploy ArgoCD FinOps Application Manifest

Apply the ArgoCD `Application` resource to manage the FinOps Helm chart:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: finops-application
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/vikranth18devops/AI-FinOps.git'
    targetRevision: HEAD
    path: chart
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: finops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - RespectIgnoreDifferences=true
  ignoreDifferences:
    - group: apps
      kind: StatefulSet
      jsonPointers:
        - /spec/volumeClaimTemplates
EOF
```

---

## 🔍 Step 6: Verify GitOps Synchronization & Application Deployment

```bash
# 1. Check Application Status in ArgoCD
kubectl get application finops-application -n argocd

# 2. Verify Microservices & Database Pods in finops Namespace
kubectl get pods -n finops

# 3. Verify Ingress Routing
kubectl get ingress -n finops
```

Expected Output:
```text
NAME                                READY   STATUS    RESTARTS   AGE
finops-backend-7894bc-x123          1/1     Running   0          60s
finops-frontend-6543df-y456         1/1     Running   0          60s
finops-ui-script-3210ab-z789        1/1     Running   0          60s
postgres-0                          1/1     Running   0          5m
```

---

## 🌐 Live Production Application Access Endpoints

Once all pods reach `1/1 Running`, access your live multi-cloud production application services using your Traefik Public LoadBalancer IP (`${TRAEFIK_IP}`):

1. 📱 **React Frontend Dashboard**:
   - **Access URL**: `http://${TRAEFIK_IP}/`
   - **Description**: Full React + TypeScript FinOps Dashboard with real-time cost scanning, resource group metrics, and AI recommendations.

2. 🚀 **UI_Script Multi-Cloud Provisioning Studio**:
   - **Access URL**: `http://${TRAEFIK_IP}/studio`
   - **Description**: Web Studio for real-time streaming execution and teardown of Azure, AWS, and GCP infrastructure environments (`dev`, `qa`, `prd`).

3. ⚡ **FastAPI Backend API**:
   - **Access URL**: `http://${TRAEFIK_IP}/api/`
   - **Description**: FastAPI backend handling JWT authentication, Azure resource scanning, AI cost analysis, and PostgreSQL auditing.

4. ⛵ **ArgoCD GitOps Continuous Delivery UI**:
   - **Access URL**: `http://${TRAEFIK_IP}/argocd/`
   - **Username**: `admin`
   - **Password**: Run `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d` to print initial password.

---

Next Step: **[08-Custom Domain & GoDaddy DNS Integration](08-godaddy-dns-azure.md)**
