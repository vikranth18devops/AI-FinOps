# 10 - In-Cluster PostgreSQL StatefulSet Validation Guide (Azure AKS)

## 📌 Step Overview
This step covers validating database connectivity, schema creation, persistent volume storage integrity, and live record querying for the in-cluster **PostgreSQL StatefulSet** (`postgres-0`) running on **Azure AKS**.

---

## ⚡ 1. Verify PostgreSQL Pod & PVC Status

```bash
# 1. Check PostgreSQL pod running status
kubectl get pods -l app=postgres -n finops

# 2. Check PersistentVolumeClaim binding to Azure Managed Disk
kubectl get pvc -n finops

# 3. Check ClusterIP Service endpoint
kubectl get svc postgres-service -n finops
```

---

## 🔍 2. Interactive psql Database Inspection

Connect directly to the PostgreSQL database inside the AKS pod using `kubectl exec`:

```bash
# Connect to in-cluster PostgreSQL database via psql CLI
kubectl exec -it postgres-0 -n finops -- psql -U finopsadmin -d cloud_cost_db
```

### Run SQL Validation Queries inside psql:

```sql
-- 1. List all database tables
\dt

-- 2. Verify schema structure of remediations audit table
\d remediations

-- 3. Query executed fix commands and total dollars saved
SELECT id, user_email, resource_group, command, status, estimated_savings, created_at 
FROM remediations 
ORDER BY created_at DESC;

-- 4. Exit psql
\q
```

---

## 🧪 3. Network Connectivity Test from FastAPI Backend Pod

Test inter-pod DNS resolution and PostgreSQL TCP connectivity (Port 5432) from the backend API:

```bash
kubectl exec -it deployment/finops-backend -n finops -- python -c "
import asyncio, asyncpg
async def test_db():
    conn = await asyncpg.connect('postgresql://finopsadmin:SecretPass123!@postgres-service.finops.svc.cluster.local:5432/cloud_cost_db')
    print('✅ Connected successfully to in-cluster PostgreSQL!')
    rows = await conn.fetch('SELECT COUNT(*) FROM remediations')
    print('Remediations count:', rows[0][0])
    await conn.close()
asyncio.run(test_db())
"
```

---

## 🔍 Step Verification Checklist
- [x] Pod `postgres-0` is in status `Running` (1/1).
- [x] PVC `postgres-data-postgres-0` is `Bound` to Azure Managed Disk (`managed-csi`).
- [x] DNS hostname `postgres-service.finops.svc.cluster.local:5432` resolves cleanly.
- [x] `remediations` audit table contains active historical records.

---

Next Step: **[11-GitHub Actions CI/CD Pipeline Setup](11-github-actions-ci-cd-azure.md)**
