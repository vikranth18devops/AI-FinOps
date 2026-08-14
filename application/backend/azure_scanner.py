import subprocess
import shutil
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class AzureCLIError(Exception):
    """Base exception for Azure CLI operations."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AzureCLINotInstalledError(AzureCLIError):
    """Raised when Azure CLI executable is not installed or not found in PATH."""
    def __init__(self, message: str = "Azure CLI ('az') is not installed or not found in system PATH."):
        super().__init__(message, status_code=503)


class AzureCLINotLoggedInError(AzureCLIError):
    """Raised when Azure CLI is not authenticated or session expired."""
    def __init__(self, message: str = "Azure CLI is not logged in or session has expired. Please run 'az login' to authenticate."):
        super().__init__(message, status_code=401)


class ResourceGroupNotFoundError(AzureCLIError):
    """Raised when specified Azure resource group does not exist."""
    def __init__(self, message: str = "Specified resource group was not found or is inaccessible."):
        super().__init__(message, status_code=404)


def _find_az_binary() -> str:
    """Locate the az executable in system PATH."""
    az_path = shutil.which("az") or shutil.which("az.cmd")
    if not az_path:
        raise AzureCLINotInstalledError()
    return az_path


def _run_az_cmd(args: List[str]) -> Any:
    """
    Executes an az CLI command via subprocess and returns parsed JSON output.
    """
    az_path = _find_az_binary()
    cmd = [az_path] + args

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
    except FileNotFoundError:
        raise AzureCLINotInstalledError()
    except Exception as e:
        logger.error(f"Unexpected error executing Azure CLI: {str(e)}")
        raise AzureCLIError(f"Failed to execute Azure CLI command: {str(e)}", status_code=500)

    if result.returncode != 0:
        stderr = result.stderr.strip()
        stdout = result.stdout.strip()
        err_msg = stderr or stdout or "Unknown Azure CLI error"
        err_lower = err_msg.lower()

        logger.warning(f"Azure CLI command failed with code {result.returncode}: {err_msg}")

        # Check for authentication / login issues
        if any(term in err_lower for term in [
            "az login",
            "interactive authentication is needed",
            "token has expired",
            "nologgedin",
            "no subscription found",
            "please run 'az login'",
            "aadsts700082"
        ]):
            raise AzureCLINotLoggedInError()

        # Check for resource group not found issues
        if any(term in err_lower for term in [
            "resourcegroupnotfound",
            "could not be found",
            "does not exist",
            "was not found"
        ]):
            raise ResourceGroupNotFoundError(f"Resource group error: {err_msg}")

        raise AzureCLIError(f"Azure CLI error: {err_msg}", status_code=400)

    output = result.stdout.strip()
    if not output:
        return []

    try:
        return json.loads(output)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Azure CLI JSON output: {e}. Output was: {output}")
        raise AzureCLIError("Failed to parse JSON response from Azure CLI.", status_code=500)


def list_resource_groups() -> List[Dict[str, Any]]:
    """
    Executes 'az group list -o json' to retrieve all Azure Resource Groups.
    Returns structured list of resource group details.
    """
    raw_groups = _run_az_cmd(["group", "list", "-o", "json"])

    formatted_groups = []
    for rg in raw_groups:
        formatted_groups.append({
            "name": rg.get("name", ""),
            "location": rg.get("location", ""),
            "id": rg.get("id"),
            "tags": rg.get("tags") or {},
            "provisioning_state": rg.get("properties", {}).get("provisioningState") if isinstance(rg.get("properties"), dict) else None
        })

    return formatted_groups


def estimate_resource_cost(res: Dict[str, Any]) -> float:
    """
    Estimates current monthly cost in USD for a scanned Azure resource based on type, SKU, and properties.
    """
    res_type = (res.get("type") or "").lower()
    sku_obj = res.get("sku") if isinstance(res.get("sku"), dict) else {}
    sku_name = str(sku_obj.get("name") or sku_obj.get("tier") or "").lower()
    props = res.get("properties") or {}

    # 1. Virtual Machines
    if "virtualmachines" in res_type:
        if "standard_b1s" in sku_name or "b1s" in sku_name:
            return 10.66
        elif "standard_b1ms" in sku_name or "b1ms" in sku_name:
            return 20.73
        elif "standard_b2s" in sku_name or "b2s" in sku_name:
            return 37.96
        elif "standard_d2s_v5" in sku_name or "d2s_v5" in sku_name:
            return 70.08
        elif "standard_d4s_v5" in sku_name or "d4s_v5" in sku_name:
            return 140.16
        elif "f2s" in sku_name or "f4s" in sku_name:
            return 85.00
        return 45.00

    # 2. App Service Plans
    elif "serverfarms" in res_type or "appservice" in res_type:
        if "f1" in sku_name or "free" in sku_name:
            return 0.00
        elif "b1" in sku_name:
            return 13.14
        elif "b2" in sku_name:
            return 26.28
        elif "s1" in sku_name:
            return 73.00
        elif "p1v2" in sku_name or "p1v3" in sku_name:
            return 146.00
        return 20.00

    # 3. Storage Accounts
    elif "storageaccounts" in res_type:
        access_tier = str(props.get("accessTier") or "").lower()
        if access_tier == "cool":
            return 2.50
        elif access_tier == "archive":
            return 1.00

        if "standard_zrs" in sku_name or "zrs" in sku_name:
            return 12.50
        elif "standard_grs" in sku_name or "grs" in sku_name:
            return 18.00
        elif "premium" in sku_name:
            return 35.00
        return 5.00

    # 4. Log Analytics Workspaces
    elif "workspaces" in res_type:
        retention = props.get("retentionInDays") or props.get("retentionTime") or 30
        try:
            r_days = int(retention)
        except (ValueError, TypeError):
            r_days = 30
        if r_days >= 90:
            return 28.00
        elif r_days >= 60:
            return 15.00
        return 5.00

    # 5. Key Vaults
    elif "vaults" in res_type or "keyvault" in res_type:
        if "premium" in sku_name:
            return 15.00
        return 3.00

    # 6. Container Registries
    elif "registries" in res_type:
        if "premium" in sku_name:
            return 50.00
        elif "standard" in sku_name:
            return 20.00
        return 5.00

    # 7. Public IP Addresses
    elif "publicipaddresses" in res_type:
        if "static" in sku_name or "standard" in sku_name:
            return 3.65
        return 2.92

    # 8. Managed Disks
    elif "disks" in res_type:
        if "premium" in sku_name:
            return 35.00
        return 15.00

    # 9. Databases
    elif "flexibleservers" in res_type or "sql/servers" in res_type or "database" in res_type:
        return 45.00

    # 10. Core Networking / Identity baseline (VNets, Subnets, NSGs, Managed Identities)
    elif any(core in res_type for core in ["virtualnetworks", "subnets", "networksecuritygroups", "userassignedidentities", "identities"]):
        return 0.00

    return 10.00


def list_resources_in_group(resource_group: str) -> List[Dict[str, Any]]:
    """
    Executes 'az resource list --resource-group <name> -o json' to retrieve resources.
    Enriches details for VMs, storage accounts, disks, and public IPs to detect fixed states.
    Calculates estimated monthly cost for each resource.
    """
    if not resource_group or not resource_group.strip():
        raise ResourceGroupNotFoundError("Resource group name cannot be empty.")

    rg_clean = resource_group.strip()
    raw_resources = _run_az_cmd(["resource", "list", "--resource-group", rg_clean, "-o", "json"])

    # Detailed resource mapping caches
    vm_size_map = {}
    storage_tier_map = {}
    disk_state_map = {}
    pip_assoc_map = {}

    has_vms = any("virtualmachines" in (res.get("type") or "").lower() for res in raw_resources)
    if has_vms:
        try:
            vm_list = _run_az_cmd(["vm", "list", "-g", rg_clean, "-o", "json"])
            for vm in vm_list:
                vm_name = vm.get("name", "")
                vm_size = vm.get("hardwareProfile", {}).get("vmSize")
                if vm_name and vm_size:
                    vm_size_map[vm_name.lower()] = vm_size
        except Exception as e:
            logger.warning(f"Failed to fetch detailed VM size map: {e}")

    has_storage = any("storageaccounts" in (res.get("type") or "").lower() for res in raw_resources)
    if has_storage:
        try:
            st_list = _run_az_cmd(["storage", "account", "list", "-g", rg_clean, "-o", "json"])
            for st in st_list:
                st_name = st.get("name", "")
                st_tier = st.get("accessTier")
                if st_name and st_tier:
                    storage_tier_map[st_name.lower()] = st_tier
        except Exception as e:
            logger.warning(f"Failed to fetch storage account tier map: {e}")

    has_disks = any("disks" in (res.get("type") or "").lower() for res in raw_resources)
    if has_disks:
        try:
            disk_list = _run_az_cmd(["disk", "list", "-g", rg_clean, "-o", "json"])
            for disk in disk_list:
                d_name = disk.get("name", "")
                d_state = disk.get("diskState") or ("Attached" if disk.get("managedBy") else "Unattached")
                if d_name:
                    disk_state_map[d_name.lower()] = d_state
        except Exception as e:
            logger.warning(f"Failed to fetch disk state map: {e}")

    has_pips = any("publicipaddresses" in (res.get("type") or "").lower() for res in raw_resources)
    if has_pips:
        try:
            pip_list = _run_az_cmd(["network", "public-ip", "list", "-g", rg_clean, "-o", "json"])
            for pip in pip_list:
                p_name = pip.get("name", "")
                is_assoc = bool(pip.get("ipConfiguration"))
                if p_name:
                    pip_assoc_map[p_name.lower()] = is_assoc
        except Exception as e:
            logger.warning(f"Failed to fetch public IP association map: {e}")

    formatted_resources = []
    for res in raw_resources:
        res_name = res.get("name", "")
        res_type = res.get("type", "")
        res_name_lower = res_name.lower()

        sku_obj = res.get("sku") or {}
        if not isinstance(sku_obj, dict):
            sku_obj = {}

        props_obj = res.get("properties") or {}
        if not isinstance(props_obj, dict):
            props_obj = {}

        # Populate exact live VM hardwareProfile vmSize
        if "virtualmachines" in res_type.lower():
            exact_vm_size = vm_size_map.get(res_name_lower) or res.get("hardwareProfile", {}).get("vmSize") or props_obj.get("hardwareProfile", {}).get("vmSize")
            if exact_vm_size:
                sku_obj["name"] = exact_vm_size

        # Populate exact live Storage accessTier
        if "storageaccounts" in res_type.lower():
            exact_tier = storage_tier_map.get(res_name_lower) or props_obj.get("accessTier")
            if exact_tier:
                props_obj["accessTier"] = exact_tier

        # Populate exact live Disk state
        if "disks" in res_type.lower():
            exact_state = disk_state_map.get(res_name_lower) or props_obj.get("diskState")
            if exact_state:
                props_obj["diskState"] = exact_state

        # Populate exact live Public IP association state
        if "publicipaddresses" in res_type.lower():
            if res_name_lower in pip_assoc_map:
                props_obj["isAssociated"] = pip_assoc_map[res_name_lower]

        res_item = {
            "id": res.get("id", ""),
            "name": res_name,
            "type": res_type,
            "location": res.get("location", ""),
            "sku": sku_obj,
            "tags": res.get("tags") or {},
            "kind": res.get("kind"),
            "plan": res.get("plan"),
            "properties": props_obj,
            "resource_group": res.get("resourceGroup", rg_clean)
        }

        est_cost = estimate_resource_cost(res_item)
        res_item["estimated_monthly_cost"] = est_cost
        res_item["estimated_monthly_cost_formatted"] = f"${est_cost:.2f}/mo"

        formatted_resources.append(res_item)

    return formatted_resources



def list_subscriptions() -> List[Dict[str, Any]]:
    """
    Lists all Azure subscriptions attached to the authenticated account.
    """
    logger.info("Fetching available Azure subscriptions...")
    raw_subs = _run_az_cmd(["account", "list", "--output", "json"])

    subscriptions = []
    if isinstance(raw_subs, list):
        for sub in raw_subs:
            subscriptions.append({
                "id": sub.get("id", ""),
                "name": sub.get("name", "Unnamed Subscription"),
                "isDefault": sub.get("isDefault", False),
                "state": sub.get("state", "Enabled"),
                "tenantId": sub.get("tenantId", "")
            })

    return subscriptions


def set_active_subscription(subscription_id: str) -> bool:
    """
    Sets the active Azure CLI subscription.
    """
    logger.info(f"Switching active Azure subscription to {subscription_id}...")
    _run_az_cmd(["account", "set", "--subscription", subscription_id])
    return True

