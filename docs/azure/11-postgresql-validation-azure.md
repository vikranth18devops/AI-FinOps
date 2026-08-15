# AI-FinOps — PostgreSQL Database & StatefulSet Validation Guide (Azure AKS)

This guide explains how to connect to the **in-cluster PostgreSQL database** (`postgres-0`) running inside the **Azure AKS** cluster and query every table belonging to the AI Cloud Cost Detective microservices.

It is the **post-deploy companion** to `docs/azure/01-10` — once Phase 7 is green and pods are `Ready` (`1/1 Running`), every command below works out-of-the-box.

---

## How the Database is Set Up

AI-FinOps runs **1 PostgreSQL pod** (`postgres-0`) as a StatefulSet inside the `finops` namespace backed by Azure Managed Disks (`managed-csi` storage class). Every microservice component (FastAPI Backend, UI_Script Studio, React Dashboard) points at **one central database called `cloud_cost_db`**.

| Table | What it Stores | Key Columns | Seed Data Status |
|---|---|---|---|
| `users` | Login credentials & JWT identity | `id`, `email`, `password_hash`, `created_at` | Created on user signup |
| `analyses` | AI cost detection & scanning analysis reports | `id`, `user_id`, `resource_group`, `issues_found`, `estimated_savings`, `analysis_result` | Generated upon resource scanning |
| `schedules` | Automated recurring cost auditing schedules | `id`, `user_id`, `resource_group`, `frequency`, `alert_email`, `status` | Configured in Schedules portal |
| `remediations` | Automated remediation audit trail & savings | `id`, `user_email`, `resource_group`, `command`, `status`, `estimated_savings`, `output` | **2 Pre-seeded audit records** |

**Total: 4 core tables, 1 database (`cloud_cost_db`), 1 namespace (`finops`).**

> 💡 **A fresh cluster is NOT empty** — the database migration auto-seeds **2 historical remediation records** on first startup (`az storage account update...`, `az vm deallocate...`). Every other table initializes cleanly.

---

## Step 1: Connect to the Cluster + the Postgres Pod

First, make sure your `kubectl` context is pointed at your Azure AKS cluster:

```bash
# 1. Fetch AKS credentials
az aks get-credentials --resource-group finops-global-rg --name finops-aks-cluster

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

-- ── Run sample queries ──
SELECT * FROM users;
SELECT id, resource_group, estimated_savings FROM remediations;

-- ── Exit shell ──
\q
```

---

## Step 2: Query Each Table

---

### Table 1: `users` — Registered Engineer Accounts

Stores user authentication credentials, email addresses, and bcrypt password hashes.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL (PK) | Unique user ID — referenced by `analyses.user_id` |
| `email` | VARCHAR(255) | Email address (unique login key) |
| `password_hash` | TEXT | bcrypt hashed password |
| `created_at` | TIMESTAMPTZ | Account registration timestamp |

```bash
# Every registered engineer account
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, email, created_at FROM users ORDER BY created_at DESC;"

# Count total accounts
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT COUNT(*) AS total_engineers FROM users;"

# Find user by email
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, email, created_at FROM users WHERE email = 'vikranth.devops18@gmail.com';"
```

---

### Table 2: `analyses` — AI Cost Scanner Reports

Stores full resource scan results, AI recommendations, detected cost leaks, and estimated monthly dollar savings.

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(100) (PK) | Unique analysis tracking ID |
| `user_id` | INT | User who ran the analysis (FK to `users.id`) |
| `resource_group` | VARCHAR(255) | Scanned Azure Resource Group |
| `resources_scanned` | INT | Total Azure resources scanned |
| `issues_found` | INT | Total cost issues identified |
| `estimated_savings` | TEXT | Total potential savings (e.g., `$320.00/month`) |
| `analysis_result` | JSONB | Full structured AI JSON payload (issues, recommendations, fix commands) |
| `status` | VARCHAR(50) | `completed` / `running` / `failed` |
| `created_at` | TIMESTAMPTZ | Scan execution timestamp |

```bash
# All analysis reports
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, resource_group, resources_scanned, issues_found, estimated_savings, created_at 
      FROM analyses ORDER BY created_at DESC;"

# Pretty-print JSON analysis result for a specific scan
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, jsonb_pretty(analysis_result) FROM analyses ORDER BY created_at DESC LIMIT 1;"

# Total potential savings across all scans
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT resource_group, count(*) AS scans, sum(issues_found) AS total_issues 
      FROM analyses GROUP BY resource_group;"
```

---

### Table 3: `schedules` — Recurring Cost Audit Cron Jobs

Stores automated scanning schedules and alert email preferences.

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(100) (PK) | Schedule ID |
| `user_id` | INT | Schedule owner (FK to `users.id`) |
| `resource_group` | VARCHAR(255) | Azure Resource Group to monitor |
| `frequency` | VARCHAR(50) | `daily` / `weekly` / `monthly` |
| `alert_email` | VARCHAR(255) | Recipient email for cost leak alerts |
| `status` | VARCHAR(50) | `active` / `paused` |
| `last_run` | TIMESTAMPTZ | Last audit execution time |
| `next_run` | TIMESTAMPTZ | Next scheduled run time |

```bash
# All active schedules
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, resource_group, frequency, alert_email, status, next_run 
      FROM schedules WHERE status = 'active';"

# Count schedules by frequency
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT frequency, COUNT(*) FROM schedules GROUP BY frequency;"
```

---

### Table 4: `remediations` — Automated Fix Audit Log

Stores executed CLI remediation commands (VM deallocations, unattached disk deletions, storage tagging) and actual cost savings.

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(100) (PK) | Remediation record ID |
| `user_id` | INT | Executing user |
| `user_email` | VARCHAR(255) | User email |
| `resource_group` | VARCHAR(255) | Azure Resource Group |
| `command` | TEXT | Executed Azure CLI command |
| `status` | VARCHAR(50) | `SUCCESS` / `FAILED` |
| `estimated_savings` | VARCHAR(100) | Monthly savings realized (e.g., `$180.00/month`) |
| `output` | TEXT | CLI command execution output log |
| `created_at` | TIMESTAMPTZ | Execution timestamp |

> 💡 **Pre-seeded data**: `remediations` is populated with 2 sample audit records on first startup.

```bash
# All remediations audit records
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, user_email, resource_group, command, status, estimated_savings, created_at 
      FROM remediations ORDER BY created_at DESC;"

# Successful remediations only
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, command, estimated_savings, output FROM remediations WHERE status = 'SUCCESS';"
```

---

## Useful Dashboard & Health Check Queries

Copy-paste any of these one-liners for an instant database health check:

```bash
# ─── 1. Total Registered Accounts ──────────────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT COUNT(*) AS total_users FROM users;"

# ─── 2. Row Count Summary for All Tables ───────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT relname AS table, n_live_tup AS rows 
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public' 
      ORDER BY relname;"
```

Expected Output on a fresh cluster:

```text
    table     | rows 
--------------+------
 analyses     |    0
 remediations |    2  ← pre-seeded
 schedules    |    0
 users        |    0
```

---

## Quick Copy-Paste: Interactive Shell Session

To open an interactive session and inspect all tables:

```bash
kubectl exec -it -n finops postgres-0 -- psql -U finopsadmin -d cloud_cost_db
```

Inside `psql`:

```sql
-- See all tables
\dt

-- Query users
SELECT * FROM users;

-- Query analyses
SELECT id, resource_group, issues_found, estimated_savings FROM analyses;

-- Query schedules
SELECT * FROM schedules;

-- Query remediations audit log
SELECT id, command, status, estimated_savings FROM remediations;

\q
```

---

## Connection Details (Reference)

| Setting | Value |
|---|---|
| Host (in-cluster) | `postgres-service.finops.svc.cluster.local` (or `postgres-service`) |
| Port | `5432` |
| Username | `finopsadmin` |
| Password | `SecretPass123!` (see `chart/values.yaml` → `postgres.password`) |
| Database | `cloud_cost_db` |
| Pod Name | `postgres-0` |
| Namespace | `finops` |
| StatefulSet | `postgres` |
| PVC | `data-postgres-0` (10 Gi Azure Managed Disk `managed-csi`) |
| Tables | 4 total (`users`, `analyses`, `schedules`, `remediations`) |

---

## Connecting from Your Laptop (Optional)

To connect from GUI tools like **DBeaver**, **TablePlus**, or local `psql`:

```bash
# Forward in-cluster port 5432 to local port 5433
kubectl -n finops port-forward svc/postgres-service 5433:5432
```

In your GUI connection settings:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `cloud_cost_db` |
| Username | `finopsadmin` |
| Password | `SecretPass123!` |
