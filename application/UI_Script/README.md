# 🚀 Multi-Cloud Provisioner Web UI Studio (`UI_Script`)

<p align="left">
  <img src="https://img.shields.io/badge/Provider-Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white" />
  <img src="https://img.shields.io/badge/Provider-AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/Provider-GCP-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-Port_8585-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
</p>

An interactive, multi-cloud Web UI Studio located in `application/UI_Script` that allows users to select cloud providers (**Azure**, **AWS**, **GCP**), pick live regions, configure dynamic environments (`dev`, `qa`, `prd`, `stg`, `uat`), trigger live 12-resource per-environment provisioning, stream real-time percentage progress bars, and terminate running provisioner processes on demand.

---

## 🌟 Studio Features

1. **🌐 Multi-Cloud Provider Selection**:
   - Provider pills with glowing status rings for **Azure** (`glow-cyan`), **AWS** (`glow-amber`), and **GCP** (`glow-rose`).

2. **🌍 Dynamic Live Region Fetching**:
   - Dynamically queries live cloud CLI APIs (`az account list-locations`, `aws ec2 describe-regions`, `gcloud compute regions list`).

3. **🛠️ Dynamic Environment Selector**:
   - Empty default state (`availableEnvs = []`) with quick-add chips (`+ dev`, `+ qa`, `+ prd`, `+ stg`) and custom input text box.
   - Individual delete buttons (`×`) on every chip for selective stack creation.

4. **📊 Real-Time Progress Bar & Terminal Logs**:
   - Streams live percentage progress (`0%` to `100%`) and step-by-step resource creation logs (`[1/12] Creating VNet... [DONE ✓]`).

5. **⛔ Cancel Execution Button**:
   - Sends an immediate termination signal (`POST /api/provision/cancel`) to terminate the active daemon subprocess (`active_process.kill()`).

---

## 🚀 How to Run the Web UI Studio

From workspace root:
```bash
./start_local.sh
```

Or standalone:
```bash
cd application/UI_Script
python3 main.py
```

Open your browser at **`http://localhost:8585`** (or **`https://vikranthsunkarpally.in/studio`** in production).
