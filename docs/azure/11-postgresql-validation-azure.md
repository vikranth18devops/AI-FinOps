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

## Step 2: Query Core Table Schemas

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

## Step 3: User Account Management & Activity Analytics

---

### 3.1 Create a New Engineer Account Manually

```bash
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "INSERT INTO users (email, password_hash) 
      VALUES ('lead.engineer@company.com', '\$2b\$12\$e8a5bZ...bcrypt_hash_here...') 
      RETURNING id, email, created_at;"
```

### 3.2 List & Search Registered Users

```bash
# Formatted list of all users with registration date
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, email, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS registered_on 
      FROM users 
      ORDER BY id ASC;"

# Search users by email domain (e.g. @gmail.com)
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, email, created_at 
      FROM users 
      WHERE email LIKE '%@gmail.com' 
      ORDER BY created_at DESC;"
```

### 3.3 User Cross-Table Activity Summary (Joins)

```bash
# Aggregated activity across Users, Analyses, Schedules, and Remediations
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT u.id, u.email, 
             COUNT(DISTINCT a.id) AS scans_run, 
             COUNT(DISTINCT s.id) AS active_schedules, 
             COUNT(DISTINCT r.id) AS fixes_executed 
      FROM users u 
      LEFT JOIN analyses a ON a.user_id = u.id 
      LEFT JOIN schedules s ON s.user_id = u.id 
      LEFT JOIN remediations r ON r.user_id = u.id 
      GROUP BY u.id, u.email 
      ORDER BY u.id ASC;"
```

### 3.4 Update Password & Delete Account

```bash
# Update user password hash
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "UPDATE users 
      SET password_hash = '\$2b\$12\$new_updated_hash...' 
      WHERE email = 'lead.engineer@company.com';"

# Delete user account
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "DELETE FROM users WHERE email = 'lead.engineer@company.com';"
```

---

## Step 4: Data Lifecycle & CRUD Operations

```bash
# ─── 4.1 Insert a Manual Audit Schedule ───────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "INSERT INTO schedules (id, user_id, resource_group, frequency, alert_email, status, next_run) 
      VALUES ('sched-manual-01', 1, 'finops-global-rg', 'weekly', 'admin@vikranth18devops.in', 'active', NOW() + INTERVAL '7 days') 
      RETURNING id, resource_group, frequency, status;"

# ─── 4.2 Toggle Schedule Status (Active <-> Paused) ───────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "UPDATE schedules SET status = 'paused' WHERE id = 'sched-manual-01';"

# ─── 4.3 Insert a Manual Remediation Record ───────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "INSERT INTO remediations (id, user_id, user_email, resource_group, command, status, estimated_savings, output) 
      VALUES ('rem-manual-99', 1, 'vikranth.devops18@gmail.com', 'finops-global-rg', 'az disk delete -g finops-global-rg -n unattached-disk-01 --yes', 'SUCCESS', '\$95.00/month', '[✓] SUCCESS: Unattached disk deleted successfully.') 
      RETURNING id, status, estimated_savings;"

# ─── 4.4 Clean Up Analyses Older Than 30 Days ─────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "DELETE FROM analyses WHERE created_at < NOW() - INTERVAL '30 days';"
```

---

## Step 5: Financial & Cost Optimization Analytics

```bash
# ─── 5.1 Total dollar savings realized from executed fixes ──────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT status, COUNT(*) AS total_fixes, 
             SUM(CAST(REPLACE(REPLACE(estimated_savings, '$', ''), '/month', '') AS NUMERIC)) AS total_monthly_savings 
      FROM remediations 
      GROUP BY status;"

# ─── 5.2 Top 5 Resource Groups by scans performed ────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT resource_group, COUNT(*) AS total_scans, SUM(issues_found) AS total_issues_found 
      FROM analyses 
      GROUP BY resource_group 
      ORDER BY total_scans DESC LIMIT 5;"

# ─── 5.3 Extract summary from JSONB analysis payload ─────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT id, resource_group, 
             analysis_result->'analysis'->'summary' AS summary,
             analysis_result->'analysis'->'total_estimated_monthly_savings' AS estimated_savings 
      FROM analyses 
      ORDER BY created_at DESC LIMIT 1;"

# ─── 5.4 Unpack individual cost leak issues inside JSONB ─────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT a.resource_group, 
             issue->>'title' AS title, 
             issue->>'severity' AS severity, 
             issue->>'estimated_savings' AS savings 
      FROM analyses a, 
           jsonb_array_elements(a.analysis_result->'analysis'->'issues') AS issue 
      ORDER BY a.created_at DESC LIMIT 10;"
```

---

## Step 6: Security, Performance & Diagnostics

```bash
# ─── 6.1 Active client connections & queries ─────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT pid, usename, client_addr, state, query_start, query 
      FROM pg_stat_activity 
      WHERE datname = 'cloud_cost_db' AND state != 'idle';"

# ─── 6.2 Database size on Azure Managed Disk ──────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT pg_size_pretty(pg_database_size('cloud_cost_db')) AS database_size;"

# ─── 6.3 Table & index disk space usage ──────────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT relname AS table_name, 
             pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
             pg_size_pretty(pg_relation_size(relid)) AS table_size,
             pg_size_pretty(pg_indexes_size(relid)) AS index_size
      FROM pg_catalog.pg_statio_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC;"

# ─── 6.4 Dead tuples & vacuum statistics ─────────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT relname AS table_name, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum 
      FROM pg_stat_user_tables;"
```

---

## Step 7: Database Backup & Restore Automation

```bash
# ─── 7.1 Export compressed database backup (pg_dump) ────────────────
kubectl exec -n finops postgres-0 -- \
  pg_dump -U finopsadmin -d cloud_cost_db -F c > ./cloud_cost_db_backup.dump

# ─── 7.2 Export plaintext SQL schema + data ───────────────────────────
kubectl exec -n finops postgres-0 -- \
  pg_dump -U finopsadmin -d cloud_cost_db --clean --if-exists > ./cloud_cost_db_schema.sql

# ─── 7.3 Restore database from dump file ─────────────────────────────
kubectl exec -i -n finops postgres-0 -- \
  pg_restore -U finopsadmin -d cloud_cost_db --clean < ./cloud_cost_db_backup.dump
```

---

## Step 8: Dashboard Health Check One-Liners

```bash
# ─── 8.1 Total Registered Accounts ──────────────────────────────────
kubectl exec -n finops postgres-0 -- \
  psql -U finopsadmin -d cloud_cost_db \
  -c "SELECT COUNT(*) AS total_users FROM users;"

# ─── 8.2 Row Count Summary for All Tables ───────────────────────────
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

## Connection Details & Local GUI Settings

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

### Connecting from Your Laptop (Optional)

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
