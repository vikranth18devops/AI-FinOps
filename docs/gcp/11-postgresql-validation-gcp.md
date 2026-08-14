# 11 - In-Cluster PostgreSQL Database Validation on GCP

<p align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-Validation-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-Storage_Audit-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

## 📌 Validation Objectives
Verify that the in-cluster PostgreSQL StatefulSet is storing investigation reports, user credentials, and remediation logs properly.

---

## ⚡ Interactive Database Verification

```bash
# 1. Shell into PostgreSQL Pod
kubectl exec -it statefulset/postgres -n finops -- psql -U finopsadmin -d cloud_cost_db

# 2. Query Tables
\dt

# 3. Query Investigation Analyses
SELECT id, resource_group, status, total_savings, created_at FROM analyses ORDER BY created_at DESC LIMIT 5;

# 4. Query Remediation Audit Log
SELECT id, resource_name, action, dollar_savings, timestamp FROM remediations;
```

---

Next Step: **Back to [GCP Guide Overview](README.md)**
