# 🚀 Azure Provisioning Web UI Studio (`UI_Script`)

An interactive Web UI Site located in `script_to_create_Az/UI_Script` that allows users to authenticate with Azure, select custom resource name prefixes, choose Azure regions, pick environment options, trigger live resource creation, view streaming terminal logs, and click direct links to verify resources in the official Azure Portal.

## 🌟 Web UI Features

1. **🔐 Azure Portal Authentication in UI**:
   - Check real-time authentication status (`az account show`).
   - Trigger `az login` directly from the Web UI.
   - Pick active Azure subscriptions.

2. **⚙️ Custom Parameters**:
   - **Prefix Input**: e.g., `snapthreadz`, `finops-cloud`, `cloud-devops`.
   - **Azure Region Selector**: West Europe, East US, East US 2, West US 2, North Europe, UK South, Central US.
   - **FinOps Environment Profiles**: Pre-configured SKUs for DEV (`Standard_D2s_v5`), QA (`Standard_B2ms`), and PRD (`Standard_D4s_v5`).

3. **🚀 Live Creation & Azure Portal Reflection**:
   - Executes `create_azure_resources.sh` live in your Azure subscription.
   - Streams live terminal console progress step-by-step.
   - Provides direct clickable links to open `DEV`, `QA`, and `PRD` resource groups in `https://portal.azure.com`.

4. **🧹 Teardown / Cleanup**:
   - One-click `--destroy` button to purge all resource groups completely.

## 🚀 How to Run the Web UI Site

Navigate to `script_to_create_Az/UI_Script`:

```bash
cd script_to_create_Az/UI_Script

# 1. Make start script executable
chmod +x start_ui.sh

# 2. Launch the Web UI server
./start_ui.sh
```

Open your browser at **`http://localhost:8500`**.
