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
kubectl apply -f chart/templates/postgres-statefulset.yaml -n finops
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

## 📌 In-Cluster DNS Connection
- **DNS Hostname**: `postgres-service.finops.svc.cluster.local`
- **Port**: `5432`
- **Database**: `cloud_cost_db`
- **Connection String**:  
  `postgresql://finopsadmin:SecretPass123!@postgres-service.finops.svc.cluster.local:5432/cloud_cost_db`

---

Next Step: **[06-Traefik Ingress on AKS](06-traefik-ingress-azure.md)**
