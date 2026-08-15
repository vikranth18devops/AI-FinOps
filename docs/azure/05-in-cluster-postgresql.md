# 05 - Deploy In-Cluster PostgreSQL StatefulSet on AKS

## 📌 Step Overview
This step deploys the **PostgreSQL database** (`postgres:15-alpine`) inside the AKS cluster as a **Kubernetes StatefulSet** with a `10Gi` `PersistentVolumeClaim` (PVC) bound to Azure Managed Disk (`managed-csi`).

Running the database in-cluster eliminates external cloud database fees (saving $100+ per month) while keeping data local and secure.

---

## 🏗️ Architecture & Storage Binding

```
[FastAPI Backend Pods] --(Port 5432)--> [ClusterIP Service: postgres-service]
                                                 |
                                                 v
                                   [PostgreSQL StatefulSet: postgres-0]
                                                 |
                                                 v
                                   [Azure Managed Disk PVC (10Gi)]
```

---

## ⚡ Deployment Commands

Apply the in-cluster PostgreSQL StatefulSet, Secret, and Service manifests:

```bash
# 1. Return to repository root directory
cd /Users/aarvik/Documents/123

# 2. Render and apply PostgreSQL StatefulSet, Secret, and Service
helm template finops ./chart --show-only templates/postgres-statefulset.yaml | kubectl apply -f -
```

---

## 🔍 Verification Commands

### 1. Check Pod Running Status
```bash
kubectl get pods -l app=postgres -n finops
```
> Expected Output: `postgres-0 1/1 Running`

### 2. Check PVC Binding Status
```bash
kubectl get pvc -n finops
```
Expected Output:
```
NAME                      STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-data-postgres-0   Bound    pvc-12345678-abcd-1234-abcd-1234567890ab   10Gi       RWO            managed-csi    1m
```

### 3. Check ClusterIP Service Endpoint
```bash
kubectl get svc postgres-service -n finops
```

---

## 📌 In-Cluster DNS Connection & Connectivity Testing

### 1. In-Cluster DNS Configuration Details
- **CoreDNS Hostname**: `postgres-service.finops.svc.cluster.local`
- **Port**: `5432`
- **Database Name**: `cloud_cost_db`
- **Default Credentials**: `finopsadmin` / `SecretPass123!`
- **Full Connection String**:  
  `postgresql://finopsadmin:SecretPass123!@postgres-service.finops.svc.cluster.local:5432/cloud_cost_db`

---

### ⚡ Step-by-Step Connection Verification

#### Step A: Test Database Access via `kubectl exec`
Connect directly to the running `postgres-0` pod shell and verify database tables:
```bash
kubectl exec -it postgres-0 -n finops -- psql -U finopsadmin -d cloud_cost_db -c "\dt"
```
> Expected Output: `Did not find any relations.` (or list of initial tables)

#### Step B: Test In-Cluster CoreDNS Resolution
Verify that Kubernetes CoreDNS resolves `postgres-service.finops.svc.cluster.local`:
```bash
kubectl run dns-test -i --rm --restart=Never --image=postgres:15-alpine -n finops -- nslookup postgres-service.finops.svc.cluster.local
```
> Expected Output: Resolves to ClusterIP (e.g. `Server: 10.1.0.10 Address: 10.1.20.113`).

#### Step C: Test Remote Connection from a Client Pod (Simulating Backend)
Simulate how the `finops-backend` pod connects across the cluster network:
```bash
kubectl run pg-client-test -i --rm --restart=Never --image=postgres:15-alpine -n finops -- \
  psql -h postgres-service.finops.svc.cluster.local -U finopsadmin -d cloud_cost_db -c "SELECT version();"
```
> Expected Output: `PostgreSQL 15.x on x86_64-pc-linux-musl...`

---

Next Step: **[06-Traefik Ingress on AKS](06-traefik-ingress-azure.md)**
