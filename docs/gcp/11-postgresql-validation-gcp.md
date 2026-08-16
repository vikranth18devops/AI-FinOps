# AI-FinOps — PostgreSQL Database & StatefulSet Validation Guide (GCP GKE)

This guide explains how to connect to the **in-cluster PostgreSQL database** (`postgres-0`) running inside the **GCP GKE** cluster and query every table belonging to the AI Cloud Cost Detective microservices.

It is the **post-deploy companion** to `docs/gcp/01-10` — once Phase 7 is green and pods are `Ready` (`1/1 Running`), every command below works out-of-the-box.

---

## How the Database is Set Up

AI-FinOps runs **1 PostgreSQL pod** (`postgres-0`) as a StatefulSet inside the `finops` namespace backed by GCP Persistent Disks (`pd-standard` storage class). Every microservice component (FastAPI Backend, UI_Script Studio, React Dashboard) points at **one central database called `cloud_cost_db`**.

| Table | What it Stores | Key Columns | Seed Data Status |
|---|---|---|---|
| `users` | Login credentials & JWT identity | `id`, `email`, `password_hash`, `created_at` | Created on user signup |
| `analyses` | AI cost detection & scanning analysis reports | `id`, `user_id`, `resource_group`, `issues_found`, `estimated_savings`, `analysis_result` | Generated upon resource scanning |
| `schedules` | Automated recurring cost auditing schedules | `id`, `user_id`, `resource_group`, `frequency`, `alert_email`, `status` | Configured in Schedules portal |
| `remediations` | Automated remediation audit trail & savings | `id`, `user_email`, `resource_group`, `command`, `status`, `estimated_savings`, `output` | **2 Pre-seeded audit records** |

**Total: 4 core tables, 1 database (`cloud_cost_db`), 1 namespace (`finops`).**

> 💡 **A fresh cluster is NOT empty** — the database migration auto-seeds **2 historical remediation records** on first startup (`gcloud compute instances stop...`, `gcloud compute disks delete...`). Every other table initializes cleanly.

---

## Step 1: Connect to the Cluster + the Postgres Pod

First, make sure your `kubectl` context is pointed at your GCP GKE cluster:

```bash
# 1. Fetch GKE credentials
gcloud container clusters get-credentials finops-gke-cluster --region us-central1

# 2. Sanity-check: pod and PVC should show Running 1/1 and Bound
kubectl -n finops get pod postgres-0
kubectl -n finops get pvc data-postgres-0
```

There are two ways to query — pick the one that fits the moment.

### Option A — Run a Single Query (Quick One-Liner)

Best for ad-hoc checks (count rows, verify a column, see the latest analysis report).

```bash
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db -c "<SQL query>"
```

**Example:**

```bash
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db -c "SELECT id, email, created_at FROM users;"
```

### Option B — Open an Interactive `psql` Shell (Exploration)

Best when you want to look around — describe tables, inspect JSON payloads, run multiple queries in a row.

```bash
kubectl exec -it -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db
```

You will see the `cloud_cost_db=#` prompt. Useful commands inside `psql`:

```sql
-- ── Discover layout ──
\dt                          -- list all tables in current database

-- ── Describe table schemas ──
\d users                     -- columns + constraints for users table
\d analyses                  -- columns + JSONB type for AI analysis
\d remediations              -- audit table structure

-- ── Exit shell ──
\q
```

---

## Step 2: Query Core Table Schemas

### Table 1: `users` — Registered Engineer Accounts

```bash
# Every registered engineer account
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, email, created_at FROM users ORDER BY created_at DESC;"

# Count total accounts
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT COUNT(*) AS total_engineers FROM users;"
```

### Table 2: `analyses` — AI Cost Scanner Reports

```bash
# All analysis reports
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, resource_group, resources_scanned, issues_found, estimated_savings, created_at 
      FROM analyses ORDER BY created_at DESC;"
```

### Table 3: `remediations` — Automated Fix Audit Log

```bash
# Total dollars saved via automated remediations on GKE
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, user_email, command, status, estimated_savings, created_at 
      FROM remediations ORDER BY created_at DESC;"
```

---

## Step 3: Health Checks & Backup Automation

```bash
# Run psql ping check
kubectl exec -n finops postgres-0 -- psql -U finopsadmin -d cloud_cost_db -c "SELECT version();"

# Backup database to local file on GCP workstation
kubectl exec -n finops postgres-0 -- pg_dump -U finopsadmin cloud_cost_db > gcp_finops_backup.sql
```
