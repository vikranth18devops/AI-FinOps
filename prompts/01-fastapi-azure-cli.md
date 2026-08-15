# 💡 Prompt 1: FastAPI Backend + Multi-Cloud CLI Scanner

<p align="left">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-CLI-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-CLI-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/GCP-gcloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>

Create a Python FastAPI backend in `application/backend/` for the AI Cloud Cost Detective project.

## 📌 Requirements

- A FastAPI server with `POST /api/analyze` endpoint accepting `{ "resource_group": "<name>" }`.
- A `GET /api/resource-groups` endpoint returning the list of active cloud resource groups.
- Use Python `subprocess` to execute native CLI commands asynchronously:
  - `az group list` / `az resource list --resource-group <name> -o json`
  - `aws ec2 describe-instances` / `aws s3api list-buckets`
  - `gcloud compute instances list` / `gcloud storage buckets list`
- Parse CLI JSON output into structured data containing resource type, name, region, SKU, and tags.
- Handle CLI missing/unauthenticated errors gracefully.
- Enable CORS for `http://localhost:5173` and `https://vikranthsunkarpally.in`.
- Include `requirements.txt` with `fastapi`, `uvicorn`, `asyncpg`, `pyjwt`, `bcrypt`.

---

## 🏗️ Project Structure

```text
application/backend/
├── main.py
├── azure_scanner.py
├── aws_scanner.py
├── gcp_scanner.py
├── requirements.txt
```

Refer to [Architecture.MD](file:///Users/aarvik/Documents/123/Architecture.MD) and [RequestFlow.MD](file:///Users/aarvik/Documents/123/RequestFlow.MD).
