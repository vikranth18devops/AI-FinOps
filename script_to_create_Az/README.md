# Azure Resource Provisioning Script (`script_to_create_Az`)

Automated, idempotent Azure CLI script to provision **12 dedicated Azure resources in EACH environment** (**Development**, **Quality Assurance**, and **Production**) — totaling **36 resources** across 3 resource groups, with distinct environment configurations, **skip-if-exists check**, and fault-tolerant execution.

---

## ✨ Features

- **Check-Before-Create (Skip Logic)**: Checks if a resource group or resource already exists before invoking creation commands. If a resource exists, it displays `[SKIP]` and moves seamlessly to the next resource.
- **Fault-Tolerant Execution**: If a specific resource encounters a quota warning or name constraint, the script logs a warning `[WARN]` and continues to create all remaining resources without halting.
- **12 Resources PER Environment**: 36 total resources created across `dev`, `qa`, and `prd`.

---

## 📋 Prerequisites

1. **Azure CLI**: Make sure Azure CLI is installed on your system.
   ```bash
   az --version
   ```

2. **Authenticate with Azure**:
   ```bash
   az login
   ```

3. **Select Active Subscription** (if using multiple subscriptions):
   ```bash
   az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"
   ```

---

### Web UI Studio (`application/UI_Script`)
- Access the zero-scroll Web UI Portal at **[http://localhost:8585](http://localhost:8585)**.
- To launch locally: `cd application/UI_Script && ./start_ui.sh` or run `./start_local.sh` from the workspace root.

---

## 🚀 Execution Steps

Navigate to the `script_to_create_Az` directory before running:

```bash
cd script_to_create_Az
```

### 1. Standard Run (Default Settings)
Provisions 3 resource groups (`finops-cloud-dev-rg`, `finops-cloud-qa-rg`, `finops-cloud-prd-rg`) and 12 resources in **EACH** environment (36 resources total) in region `eastus`:

```bash
./create_azure_resources.sh
```

### 2. Custom Prefix & Region
Pass your custom prefix and region as command-line arguments (e.g. `snapthreadz` in `eastus`):

```bash
./create_azure_resources.sh snapthreadz eastus
```

### 3. Display Help Menu
```bash
./create_azure_resources.sh --help
```

---

## 🛠️ Environment Configuration Matrix & FinOps Scenarios

The script provisions distinct, real-world FinOps cost profiles for each environment (`DEV`, `QA`, `PRD`) to evaluate cost scanning, over-provisioning detection, and savings potential:

| Feature / Resource | Development (`DEV`) | Quality Assurance (`QA`) | Production (`PRD`) |
| :--- | :--- | :--- | :--- |
| **Resource Group** | `<prefix>-dev-rg` | `<prefix>-qa-rg` | `<prefix>-prd-rg` |
| **VNet CIDR** | `10.100.0.0/16` | `10.101.0.0/16` | `10.102.0.0/16` |
| **App Subnet CIDR** | `10.100.1.0/24` | `10.101.1.0/24` | `10.102.1.0/24` |
| **DB Subnet CIDR** | `10.100.2.0/24` | `10.101.2.0/24` | `10.102.2.0/24` |
| **Virtual Machine SKU** | `Standard_D2s_v5` ($70.08/mo) | `Standard_B2ms` ($37.96/mo) | `Standard_D4s_v5` ($140.16/mo) |
| **FinOps VM Target** | Downsize to `Standard_B1s` ($10.66/mo) | Scale down to `Standard_B1ms` ($20.73/mo) | Right-size / 3-Year Reserved Instance |
| **App Service Plan SKU** | `B1` ($13.14/mo) | `B2` ($26.28/mo) | `P1v2` Premium ($146.00/mo) |
| **FinOps Plan Target** | Downgrade to `F1` Free ($0/mo) | Scale down to `B1` ($13.14/mo) | Right-size to `B2` / Auto-scale |
| **Storage Account Tier** | `Standard_LRS` (Hot) | `Standard_ZRS` (Zone Redundant) | `Standard_GRS` (Geo-Redundant) |
| **FinOps Storage Target** | Apply Lifecycle Rule to `Cool` | Transition to `Cool` / `LRS` | Blob Lifecycle Archiving |
| **Log Retention** | `30` days ($5.00/mo) | `60` days ($15.00/mo) | `90` days ($28.00/mo) |
| **Public IP Allocation** | Dynamic ($2.92/mo) | Dynamic ($2.92/mo) | Static Standard ($3.65/mo) |
| **FinOps Tag Policy** | `AutoShutdown=False` | `AutoShutdown=False` | `ReservedInstance=Eligible` |


---

## 📦 Provisioned Resources (12 Resources PER Environment = 36 Total)

Every environment (`dev`, `qa`, `prd`) receives its own dedicated set of **12 resources**:

1. **Virtual Network (VNet)** (`vnet-<prefix>-<env>`)
2. **App Subnet** (`snet-app-<env>`)
3. **Database Subnet** (`snet-db-<env>`)
4. **Network Security Group (NSG)** (`nsg-<prefix>-<env>`)
5. **Virtual Machine** (`vm-<prefix>-<env>`) — Ubuntu 22.04 LTS
6. **Storage Account** (`st<prefix><env>2026`)
7. **Blob Storage Container** (`logs-<env>`)
8. **Log Analytics Workspace** (`law-<prefix>-<env>`)
9. **Linux App Service Plan** (`asp-<prefix>-<env>`)
10. **Web App Service** (`app-<prefix>-<env>-2026`) — Python 3.11
11. **Azure Key Vault** (`kv-<prefix>-<env>-26`)
12. **Public IP Address** (`pip-<prefix>-<env>`)

---

## 🧹 Teardown & Resource Cleanup

To delete all 3 resource groups and their created resources for a specific prefix:

```bash
# Teardown custom prefix (e.g. snapthreadz)
./create_azure_resources.sh --destroy snapthreadz

# Teardown default prefix (finops-cloud)
./create_azure_resources.sh --destroy
```

---

## 🔍 Idempotency & Resiliency

- **Automatic Skipping**: If any of the 36 resources already exist, the script outputs `[SKIP]` and moves on instantly.
- **Quota Exceeded (`Operation cannot be completed without additional quota`)**:
  If your subscription has VM/App Service quota limits, the script automatically attempts `F1`/`B1` fallback, logs a warning if unavailable, and continues with remaining resources.
