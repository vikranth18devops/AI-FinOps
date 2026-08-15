# 🤖 Prompt 2: OpenAI GPT-4o FinOps AI Analyzer Engine

<p align="left">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/FinOps-Cost_Intelligence-00C853?style=for-the-badge&logo=dollar&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Async-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
</p>

Build on top of the existing FastAPI backend. Add AI-powered cost analysis using OpenAI API (`gpt-4o`) with fallback to the built-in Heuristic FinOps Engine.

## 📌 Requirements

- Create `ai_analyzer.py` module in `application/backend/`:
  - Accepts scanned multi-cloud resources from Azure, AWS, and GCP scanners.
  - Constructs structured prompt asking GPT-4o to evaluate over-provisioning, unattached storage disks, unassociated IPs, missing tags, and wrong pricing tiers.
  - Returns structured JSON response containing:
    - Overall health status and efficiency score
    - Detailed issues array (severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
    - Estimated monthly dollar savings
    - **Executable CLI fix commands** (`az`, `aws`, `gcloud`)
- Update `POST /api/analyze` to chain scanner and AI engine.
- Configure `OPENAI_API_KEY` in `.env` with fallback to local rule-based engine if key is absent.

---

## 🏗️ Project Structure Update

```text
application/backend/
├── main.py          (updated)
├── azure_scanner.py (no change)
├── aws_scanner.py   (no change)
├── gcp_scanner.py   (no change)
├── ai_analyzer.py   (new)
├── requirements.txt (updated)
└── .env.example     (updated)
```

Refer to [Architecture.MD](file:///Users/aarvik/Documents/123/Architecture.MD) and [RequestFlow.MD](file:///Users/aarvik/Documents/123/RequestFlow.MD).
