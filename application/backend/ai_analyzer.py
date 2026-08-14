import os
import json
import logging
from typing import List, Dict, Any
from openai import OpenAI, OpenAIError, AuthenticationError, RateLimitError

logger = logging.getLogger(__name__)


class AIAnalyzerError(Exception):
    """Base exception for AI analysis failures."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


SYSTEM_PROMPT = """
You are an expert Azure Cloud Cost Optimization Architect and FinOps Specialist ("AI Cloud Cost Detective").
Your task is to analyze a list of Azure resources in a given Resource Group and identify cost inefficiencies.

Focus on detecting:
1. Over-provisioned resources (VMs, databases, app service plans oversized for current needs).
2. Unused or orphaned resources (unattached disks, unassociated public IPs, idle load balancers).
3. Misconfigurations (missing auto-shutdown, missing lifecycle management on storage accounts, missing tags).
4. Wrong pricing tiers (Premium/Ultra SSD when Standard SKU suffices, Basic vs Standard tiers).
5. Cost optimization opportunities (Reserved Instances, Savings Plans, Auto-scaling).

SYSTEM-WIDE REMEDIATION RULE:
When evaluating ANY Azure resource, inspect its live configuration parameters before reporting an issue:
- Virtual Machines: If SKU is ALREADY a burstable B-series (Standard_B1s, Standard_B2s, Standard_B1ms, Standard_B2ms, etc.), do NOT report over-provisioning.
- Storage Accounts: If access tier is ALREADY Cool or Archive, do NOT report missing tiering.
- Managed Disks: If disk is ALREADY attached to a VM (diskState == Attached or managedBy is present), do NOT report unattached disk fees.
- Public IPs: If public IP is ALREADY associated with a NIC/LB, do NOT report unassociated IP fees.
- Tags: If AutoShutdown=True or Environment tag is present, do NOT report missing tags.

If all resources in the resource group have been remediated or are optimally sized, return an empty issues list [] with total_estimated_monthly_savings of "$0.00/month".

You MUST respond strictly with a valid JSON object matching the following JSON schema:
{
  "summary": "<High-level executive summary of cost health and findings>",
  "total_estimated_monthly_savings": "<e.g., $150.00/month>",
  "issues": [
    {
      "id": "<unique issue identifier string, e.g. issue-1>",
      "title": "<Short descriptive title>",
      "category": "<Over-provisioning | Unused Resource | Misconfiguration | Storage & Logging | Pricing Tier>",
      "severity": "<high | medium | low>",
      "affected_resource": "<Name of affected Azure resource>",
      "description": "<Detailed explanation of the issue and why it wastes cost>",
      "estimated_savings": "<e.g., $45.00/month>",
      "fix_command": "<Exact, copy-pasteable Azure CLI command to remediate or resize the resource>"
    }
  ],
  "recommendations": [
    "<High-level strategic recommendation 1>",
    "<High-level strategic recommendation 2>"
  ]
}

Ensure all fix_command entries use valid 'az' CLI commands with proper syntax, referencing the resource group name provided.
"""


def _build_cost_breakdown(resources: List[Dict[str, Any]], issues: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes current cost, potential savings, post-remediation cost, and resource-by-resource breakdown.
    """
    total_current = 0.0
    issue_savings_map = {}

    for issue in issues:
        res_name = issue.get("affected_resource", "")
        sav_str = issue.get("estimated_savings", "$0.00")
        try:
            val = float(sav_str.replace("$", "").replace("/month", "").replace("/mo", "").strip())
        except (ValueError, AttributeError):
            val = 0.0
        if res_name:
            issue_savings_map[res_name.lower()] = issue_savings_map.get(res_name.lower(), 0.0) + val

    breakdown = []
    total_savings = 0.0

    from azure_scanner import estimate_resource_cost

    for res in resources:
        name = res.get("name", "")
        res_type = res.get("type", "")
        cost = res.get("estimated_monthly_cost")
        if cost is None:
            cost = estimate_resource_cost(res)

        total_current += cost
        sav = issue_savings_map.get(name.lower(), 0.0)
        total_savings += sav
        post_cost = max(0.0, cost - sav)

        status = "Needs Remediation" if sav > 0 else "Optimal"

        breakdown.append({
            "name": name,
            "type": res_type,
            "current_cost": f"${cost:.2f}/mo",
            "potential_savings": f"${sav:.2f}/mo" if sav > 0 else "$0.00/mo",
            "post_remediation_cost": f"${post_cost:.2f}/mo",
            "status": status
        })

    projected_cost = max(0.0, total_current - total_savings)
    savings_pct = (total_savings / total_current * 100.0) if total_current > 0 else 0.0

    return {
        "total_current_monthly_cost": f"${total_current:.2f}/month",
        "total_estimated_monthly_savings": f"${total_savings:.2f}/month",
        "projected_monthly_cost_after_remediation": f"${projected_cost:.2f}/month",
        "savings_percentage": f"{savings_pct:.1f}%",
        "resource_cost_breakdown": breakdown
    }


def _generate_fallback_analysis(resources: List[Dict[str, Any]], resource_group: str) -> Dict[str, Any]:
    """
    Generates a rule-based FinOps cost analysis report based on scanned Azure resources.
    Used as a fallback when OpenAI API credits are exhausted or offline.
    Automatically filters out remediated resources (VMs, storage accounts, disks, public IPs, tags).
    """
    issues = []

    for idx, res in enumerate(resources, 1):
        name = res.get("name", f"resource-{idx}")
        res_type = (res.get("type") or "").lower()
        tags = res.get("tags") or {}

        sku_dict = res.get("sku") if isinstance(res.get("sku"), dict) else {}
        sku_name = (sku_dict.get("name") or sku_dict.get("tier") or "Standard").strip()
        sku_lower = sku_name.lower()

        props = res.get("properties") or {}

        # 1. Virtual Machine Checks
        if "virtualmachines" in res_type:
            is_already_b_series = any(b_sku in sku_lower for b_sku in ["standard_b2s", "standard_b1s", "standard_b1ms", "standard_b2ms", "b2s", "b1s", "b1ms", "b2ms"])

            if not is_already_b_series:
                savings = 27.30
                issues.append({
                    "id": f"issue-{idx}",
                    "title": "Over-provisioned VM Instance SKU",
                    "category": "Over-provisioning",
                    "severity": "high",
                    "affected_resource": name,
                    "description": f"Virtual machine '{name}' is provisioned with SKU '{sku_name}'. Scaling down to a burstable B-series reduces monthly compute costs while maintaining performance during peak loads.",
                    "estimated_savings": f"${savings:.2f}/month",
                    "fix_command": f"az vm resize --resource-group {resource_group} --name {name} --size Standard_B1s"
                })

        # 2. Storage Account Checks
        elif "storageaccounts" in res_type:
            access_tier = (props.get("accessTier") or "").lower()
            is_tier_cool_or_archive = access_tier in ["cool", "archive"] or tags.get("Tier", "").lower() == "cool"

            if not is_tier_cool_or_archive:
                savings = 2.50
                issues.append({
                    "id": f"issue-{idx}",
                    "title": "Missing Storage Account Lifecycle Rules",
                    "category": "Storage & Logging",
                    "severity": "medium",
                    "affected_resource": name,
                    "description": f"Storage account '{name}' lacks an automated blob lifecycle management policy to tier inactive blobs from Hot to Cool/Archive storage.",
                    "estimated_savings": f"${savings:.2f}/month",
                    "fix_command": f"az storage account update --name {name} --resource-group {resource_group} --access-tier Cool --yes"
                })

        # 3. Managed Disk Checks
        elif "disks" in res_type:
            disk_state = (props.get("diskState") or "").lower()
            is_attached = disk_state == "attached" or bool(props.get("managedBy"))

            if not is_attached:
                savings = 15.00
                issues.append({
                    "id": f"issue-{idx}",
                    "title": "Unattached Managed Disk Accruing Storage Fees",
                    "category": "Unused Resource",
                    "severity": "high",
                    "affected_resource": name,
                    "description": f"Managed disk '{name}' is not attached to any active Virtual Machine, incurring idle storage charges.",
                    "estimated_savings": f"${savings:.2f}/month",
                    "fix_command": f"az disk delete --resource-group {resource_group} --name {name} --yes"
                })

        # 4. Public IP Address Checks
        elif "publicipaddresses" in res_type:
            is_associated = props.get("isAssociated", False) or bool(props.get("ipConfiguration"))

            if not is_associated:
                savings = 2.92
                issues.append({
                    "id": f"issue-{idx}",
                    "title": "Unassociated Public IP Address",
                    "category": "Unused Resource",
                    "severity": "low",
                    "affected_resource": name,
                    "description": f"Public IP address '{name}' is unassociated with any Network Interface or Load Balancer.",
                    "estimated_savings": f"${savings:.2f}/month",
                    "fix_command": f"az network public-ip delete --resource-group {resource_group} --name {name}"
                })

    cost_metrics = _build_cost_breakdown(resources, issues)

    if not issues and resources:
        return {
            "summary": f"FinOps cost investigation completed for resource group '{resource_group}'. All {len(resources)} Azure resources are currently right-sized and optimally configured with zero cost inefficiencies detected!",
            "total_current_monthly_cost": cost_metrics["total_current_monthly_cost"],
            "total_estimated_monthly_savings": "$0.00/month",
            "projected_monthly_cost_after_remediation": cost_metrics["total_current_monthly_cost"],
            "savings_percentage": "0.0%",
            "resource_cost_breakdown": cost_metrics["resource_cost_breakdown"],
            "issues": [],
            "recommendations": [
                "All scanned resources meet optimal cost efficiency standards.",
                "Periodically review resource utilization as workloads grow."
            ]
        }

    return {
        "summary": f"FinOps cost investigation completed for resource group '{resource_group}'. Evaluated {len(resources)} Azure resources for over-provisioning, idle unattached disks, and missing lifecycle policies.",
        "total_current_monthly_cost": cost_metrics["total_current_monthly_cost"],
        "total_estimated_monthly_savings": cost_metrics["total_estimated_monthly_savings"],
        "projected_monthly_cost_after_remediation": cost_metrics["projected_monthly_cost_after_remediation"],
        "savings_percentage": cost_metrics["savings_percentage"],
        "resource_cost_breakdown": cost_metrics["resource_cost_breakdown"],
        "issues": issues,
        "recommendations": [
            "Implement automated auto-shutdown rules for dev/test environments.",
            "Enable lifecycle management policies on Azure Blob storage accounts.",
            "Utilize Azure Reserved Instances for long-running production workloads to save up to 72%."
        ]
    }


def analyze_resources(resources: List[Dict[str, Any]], resource_group: str) -> Dict[str, Any]:
    """
    Analyzes Azure resources using OpenAI gpt-4o chat completions API.
    Returns structured analysis results. Falls back gracefully if API quota is exhausted.
    Automatically excludes any remediated resources.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not resources:
        return {
            "summary": f"No resources were found in resource group '{resource_group}'. There are no current costs or optimizations required.",
            "total_current_monthly_cost": "$0.00/month",
            "total_estimated_monthly_savings": "$0.00/month",
            "projected_monthly_cost_after_remediation": "$0.00/month",
            "savings_percentage": "0.0%",
            "resource_cost_breakdown": [],
            "issues": [],
            "recommendations": ["No actions required for empty resource groups."]
        }

    if not api_key or api_key.strip() == "":
        logger.warning("OPENAI_API_KEY missing. Using FinOps rule-based fallback analysis engine.")
        return _generate_fallback_analysis(resources, resource_group)

    client = OpenAI(api_key=api_key.strip())

    user_prompt = f"""
Analyze the following Azure resources located in Resource Group '{resource_group}':

Resource Group Name: {resource_group}
Total Resources Count: {len(resources)}

Resources JSON Payload:
{json.dumps(resources, indent=2)}

Please perform a thorough FinOps cost investigation and output your report strictly in the requested JSON format.
Ensure any resource that is already right-sized or remediated is NOT reported as an issue!
"""

    try:
        logger.info(f"Sending cost analysis request to OpenAI (gpt-4o) for RG: {resource_group} ({len(resources)} resources)")

        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.strip()},
                {"role": "user", "content": user_prompt.strip()}
            ]
        )

        content = response.choices[0].message.content
        if not content:
            raise AIAnalyzerError("OpenAI API returned an empty response.", status_code=502)

        analysis = json.loads(content)
        issues = analysis.get("issues", [])
        cost_metrics = _build_cost_breakdown(resources, issues)

        return {
            "summary": analysis.get("summary", "Analysis completed."),
            "total_current_monthly_cost": cost_metrics["total_current_monthly_cost"],
            "total_estimated_monthly_savings": analysis.get("total_estimated_monthly_savings", cost_metrics["total_estimated_monthly_savings"]),
            "projected_monthly_cost_after_remediation": cost_metrics["projected_monthly_cost_after_remediation"],
            "savings_percentage": cost_metrics["savings_percentage"],
            "resource_cost_breakdown": cost_metrics["resource_cost_breakdown"],
            "issues": issues,
            "recommendations": analysis.get("recommendations", [])
        }

    except RateLimitError as e:
        logger.warning(f"OpenAI Rate Limit / Quota Error: {e}. Falling back to FinOps analysis engine.")
        return _generate_fallback_analysis(resources, resource_group)
    except AuthenticationError as e:
        logger.warning(f"OpenAI Authentication Error: {e}. Falling back to FinOps analysis engine.")
        return _generate_fallback_analysis(resources, resource_group)
    except OpenAIError as e:
        logger.warning(f"OpenAI API Error: {e}. Falling back to FinOps analysis engine.")
        return _generate_fallback_analysis(resources, resource_group)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse OpenAI JSON output: {e}")
        return _generate_fallback_analysis(resources, resource_group)
    except Exception as e:
        logger.error(f"Unexpected error during AI analysis: {e}")
        return _generate_fallback_analysis(resources, resource_group)

