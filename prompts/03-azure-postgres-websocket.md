# 🗄️ Prompt 3: In-Cluster PostgreSQL StatefulSet & WebSocket Real-Time Progress

<p align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-15_StatefulSet-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-WebSocket-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/AsyncPG-Connection_Pool-005C8A?style=for-the-badge&logo=python&logoColor=white" />
</p>

Build on top of the existing FastAPI backend. Connect to the in-cluster PostgreSQL StatefulSet (`postgres-service.finops.svc.cluster.local:5432`) for storing users, cost investigations, and remediation execution logs, and add WebSockets for live progress tracking.

## 📌 Requirements

### 1. In-Cluster PostgreSQL Database
- Connect using `asyncpg` with connection pooling.
- Configure `DATABASE_URL` in `.env`.
- Auto-initialize schema on startup:
  - `users`: `id`, `email`, `password_hash`, `created_at`
  - `analyses`: `id`, `user_id`, `resource_group`, `resources_scanned`, `issues_found`, `estimated_savings`, `analysis_result` (JSONB), `status`, `created_at`
  - `remediations`: `id`, `user_email`, `resource_group`, `command`, `status`, `estimated_savings`, `created_at`
- Add `GET /api/history` endpoint with **15-item pagination support** returning cumulative dollar savings KPI card data ($ Saved to Date).

### 2. WebSocket Real-Time Progress
- Expose WebSocket endpoint `ws://localhost:8000/ws/progress/{analysis_id}`.
- Stream live progress updates during analysis:
  - `"10% - Authenticating & fetching resource groups..."`
  - `"35% - Scanning cloud resources across subscription..."`
  - `"65% - Running GPT-4o FinOps cost investigation..."`
  - `"90% - Logging results to PostgreSQL..."`
  - `"100% - Analysis complete"`

---

## 🏗️ Project Structure Update

```text
application/backend/
├── main.py          (updated — WebSocket & history endpoints)
├── db.py            (new — asyncpg connection pool & schema init)
├── azure_scanner.py (no change)
├── ai_analyzer.py   (no change)
├── requirements.txt (updated — asyncpg, websockets)
└── .env.example     (updated — DATABASE_URL)
```

Refer to [Architecture.MD](file:///Users/aarvik/Documents/123/Architecture.MD) and [RequestFlow.MD](file:///Users/aarvik/Documents/123/RequestFlow.MD).
