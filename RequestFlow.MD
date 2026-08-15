# 🔄 AI Cloud Cost Detective - End-to-End Request Flow

```text
①  User ─·─·─► React Dashboard (https://vikranthsunkarpally.in) ─·─·─► FastAPI Auth ─·─·─► JWT (In-Cluster PostgreSQL)

②  User selects Cloud Provider & Resource Group/VPC ─·─·─► Python Backend (/api/analyze)

③  Python Backend ─·─·─► Azure CLI / AWS CLI / GCP CLI ─·─·─► Asynchronously scans live cloud resources

④  Python Backend ─·─·─► FastAPI WebSocket (ws://.../ws/progress) ─·─·─► React UI (live progress bar)

⑤  Python Backend ─·─·─► OpenAI API (GPT-4o) / Heuristic Engine ─·─·─► Generates cost breakdown & 1-click CLI fixes

⑥  User clicks "Run Fix Command" ─·─·─► Python Backend (/api/execute-fix) ─·─·─► Executes CLI remediation live on Azure/AWS/GCP

⑦  Python Backend ─·─·─► In-Cluster PostgreSQL StatefulSet ─·─·─► Saves remediation audit record ($ Saved to Date)

⑧  React UI ◄·─·─·─ Updates cumulative savings card, paginated history (15 items), and exports PDF report
```
