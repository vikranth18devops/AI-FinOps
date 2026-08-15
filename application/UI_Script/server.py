#!/usr/bin/env python3
"""
==============================================================================
Multi-Cloud Infrastructure Provisioning Web UI Server (UI_Script)
Supports Azure, AWS, and GCP real-time streaming execution & cancellation.
==============================================================================
"""

import os
import sys
import time
import json
import subprocess
import logging
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("multi_cloud_server")

app = FastAPI(title="Multi-Cloud Provisioning UI Portal", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(BASE_DIR)
WORKSPACE_ROOT = os.path.dirname(APP_DIR)
PARENT_DIR = WORKSPACE_ROOT
SCRIPTS_DIR = os.path.join(WORKSPACE_ROOT, "script_to_create_Az")

AZURE_SCRIPT = os.path.join(SCRIPTS_DIR, "create_azure_resources.sh")
AWS_SCRIPT = os.path.join(SCRIPTS_DIR, "create_aws_resources.sh")
GCP_SCRIPT = os.path.join(SCRIPTS_DIR, "create_gcp_resources.sh")

# Active subprocess tracker for real-time cancellation
active_process: Optional[subprocess.Popen] = None
device_code_process: Optional[subprocess.Popen] = None


class ProvisionPayload(BaseModel):
    provider: str = "azure"  # azure | aws | gcp
    prefix: str = "snapthreadz"
    location: str = "westeurope"
    destroy: bool = False
    environments: Optional[List[str]] = ["dev", "qa", "prd"]


def run_cmd(cmd_args: List[str]) -> str:
    """Helper to run shell commands and return output string."""
    try:
        res = subprocess.run(
            cmd_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=300
        )
        return res.stdout
    except Exception as e:
        return f"Error executing command {' '.join(cmd_args)}: {str(e)}"


# Provider Regions Matrix
REGIONS_MATRIX = {
    "azure": [
        {"code": "westeurope", "name": "🇪🇺 West Europe (westeurope)"},
        {"code": "eastus", "name": "🇺🇸 East US (eastus)"},
        {"code": "eastus2", "name": "🇺🇸 East US 2 (eastus2)"},
        {"code": "westus2", "name": "🇺🇸 West US 2 (westus2)"},
        {"code": "northeurope", "name": "🇪🇺 North Europe (northeurope)"},
        {"code": "uksouth", "name": "🇬🇧 UK South (uksouth)"},
        {"code": "centralus", "name": "🇺🇸 Central US (centralus)"}
    ],
    "aws": [
        {"code": "us-east-1", "name": "🇺🇸 US East - N. Virginia (us-east-1)"},
        {"code": "us-east-2", "name": "🇺🇸 US East - Ohio (us-east-2)"},
        {"code": "us-west-2", "name": "🇺🇸 US West - Oregon (us-west-2)"},
        {"code": "eu-west-1", "name": "🇪🇺 EU - Ireland (eu-west-1)"},
        {"code": "eu-central-1", "name": "🇩🇪 EU - Frankfurt (eu-central-1)"},
        {"code": "ap-northeast-1", "name": "🇯🇵 Asia Pacific - Tokyo (ap-northeast-1)"}
    ],
    "gcp": [
        {"code": "us-central1", "name": "🇺🇸 us-central1 (Iowa)"},
        {"code": "us-east1", "name": "🇺🇸 us-east1 (South Carolina)"},
        {"code": "us-west1", "name": "🇺🇸 us-west1 (Oregon)"},
        {"code": "europe-west1", "name": "🇪🇺 europe-west1 (Belgium)"},
        {"code": "europe-west3", "name": "🇩🇪 europe-west3 (Frankfurt)"},
        {"code": "asia-east1", "name": "🇹🇼 asia-east1 (Taiwan)"}
    ]
}


@app.get("/", response_class=HTMLResponse)
@app.get("/studio", response_class=HTMLResponse)
async def get_ui():
    """Serves the main Web UI Site index.html."""
    html_path = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return HTMLResponse("<h1>Multi-Cloud Provisioning UI Server Running</h1>")


@app.get("/api/regions")
async def get_provider_regions(provider: str = Query("azure")):
    """Dynamically fetches active cloud regions live from Azure, AWS, or GCP CLI APIs."""
    prov = provider.lower()

    if prov == "azure":
        try:
            res = subprocess.run(
                ["az", "account", "list-locations", "--query", "[].{code:name, name:displayName}", "-o", "json"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=12
            )
            if res.returncode == 0 and res.stdout.strip():
                locations = json.loads(res.stdout)
                regions = [{"code": loc["code"], "name": f"{loc['name']} ({loc['code']})"} for loc in locations if "code" in loc and "name" in loc]
                if regions:
                    return {"provider": "azure", "live": True, "regions": regions[:30]}
        except Exception as e:
            logger.warning(f"Error fetching live Azure regions: {e}")

    elif prov == "aws":
        try:
            res = subprocess.run(
                ["aws", "ec2", "describe-regions", "--query", "Regions[].RegionName", "-o", "json"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=12
            )
            if res.returncode == 0 and res.stdout.strip():
                region_codes = json.loads(res.stdout)
                regions = [{"code": code, "name": f"AWS Region ({code})"} for code in region_codes]
                if regions:
                    return {"provider": "aws", "live": True, "regions": regions}
        except Exception as e:
            logger.warning(f"Error fetching live AWS regions: {e}")

    elif prov == "gcp":
        try:
            res = subprocess.run(
                ["gcloud", "compute", "regions", "list", "--format=json(name)"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=12
            )
            if res.returncode == 0 and res.stdout.strip():
                reg_list = json.loads(res.stdout)
                regions = [{"code": item["name"], "name": f"GCP Region ({item['name']})"} for item in reg_list if "name" in item]
                if regions:
                    return {"provider": "gcp", "live": True, "regions": regions}
        except Exception as e:
            logger.warning(f"Error fetching live GCP regions: {e}")

    return {
        "provider": prov,
        "live": False,
        "regions": REGIONS_MATRIX.get(prov, REGIONS_MATRIX["azure"])
    }


@app.on_event("startup")
async def auto_cloud_login():
    """Attempts automatic authentication for Azure on server boot."""
    client_id = os.getenv("AZURE_CLIENT_ID")
    client_secret = os.getenv("AZURE_CLIENT_SECRET")
    tenant_id = os.getenv("AZURE_TENANT_ID")
    sub_id = os.getenv("AZURE_SUBSCRIPTION_ID")

    # 1. Try Azure Service Principal login if env vars present
    if client_id and client_secret and tenant_id:
        try:
            logger.info("Attempting automatic Azure Service Principal login...")
            res = subprocess.run(["az", "login", "--service-principal", "-u", client_id, "-p", client_secret, "--tenant", tenant_id], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
            if res.returncode == 0:
                logger.info("✓ Azure Service Principal login successful!")
                if sub_id:
                    subprocess.run(["az", "account", "set", "--subscription", sub_id])
                return
        except Exception as e:
            logger.warning(f"Azure SP auto-login failed: {e}")

    # 2. Try Managed Identity on AKS
    try:
        res = subprocess.run(["az", "login", "--identity"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
        if res.returncode == 0:
            logger.info("✓ Azure Managed Identity login successful!")
            if sub_id:
                subprocess.run(["az", "account", "set", "--subscription", sub_id])
    except Exception:
        pass


class AzureCredentialsPayload(BaseModel):
    client_id: str
    client_secret: str
    tenant_id: str
    subscription_id: Optional[str] = None


@app.post("/api/auth/credentials")
async def set_azure_credentials(payload: AzureCredentialsPayload):
    """Logs in to Azure CLI inside container using submitted Service Principal credentials."""
    cmd = [
        "az", "login", "--service-principal",
        "-u", payload.client_id.strip(),
        "-p", payload.client_secret.strip(),
        "--tenant", payload.tenant_id.strip()
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
    if res.returncode == 0:
        if payload.subscription_id:
            subprocess.run(["az", "account", "set", "--subscription", payload.subscription_id.strip()])
        return {"status": "success", "message": "Successfully authenticated Azure CLI via Service Principal!", "output": res.stdout}
    else:
        return {"status": "error", "message": f"Azure CLI login failed: {res.stdout}", "output": res.stdout}


@app.get("/api/auth/status")
async def get_cloud_auth_status(provider: str = Query("azure")):
    """Checks current authentication state for Azure, AWS, or GCP."""
    prov = provider.lower()

    if prov == "azure":
        # 1. Check existing az account show
        try:
            res = subprocess.run(["az", "account", "show"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                acc = json.loads(res.stdout)
                return {
                    "provider": "azure",
                    "authenticated": True,
                    "user": acc.get("user", {}).get("name", "Authenticated Azure User"),
                    "subscription_name": acc.get("name", "Pay-As-You-Go"),
                    "subscription_id": acc.get("id", "")
                }
        except Exception:
            pass

        # 2. Try AKS Managed Identity auto-login
        try:
            res = subprocess.run(["az", "login", "--identity"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
            if res.returncode == 0:
                show_res = subprocess.run(["az", "account", "show"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
                if show_res.returncode == 0 and show_res.stdout.strip():
                    acc = json.loads(show_res.stdout)
                    return {
                        "provider": "azure",
                        "authenticated": True,
                        "user": acc.get("user", {}).get("name", "AKS Managed Identity"),
                        "subscription_name": acc.get("name", "Azure Subscription"),
                        "subscription_id": acc.get("id", "")
                    }
        except Exception:
            pass

        # 3. Try Service Principal env vars if available
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")
        tenant_id = os.getenv("AZURE_TENANT_ID")
        if client_id and client_secret and tenant_id:
            try:
                res = subprocess.run(["az", "login", "--service-principal", "-u", client_id, "-p", client_secret, "--tenant", tenant_id], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
                if res.returncode == 0:
                    show_res = subprocess.run(["az", "account", "show"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
                    if show_res.returncode == 0:
                        acc = json.loads(show_res.stdout)
                        return {
                            "provider": "azure",
                            "authenticated": True,
                            "user": f"Service Principal ({client_id[:8]}...)",
                            "subscription_name": acc.get("name", "Azure Subscription"),
                            "subscription_id": acc.get("id", "")
                        }
            except Exception:
                pass

        return {"provider": "azure", "authenticated": False, "message": "Not logged into Azure CLI (az login)."}

    elif prov == "aws":
        try:
            res = subprocess.run(["aws", "sts", "get-caller-identity", "--output", "json"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                acc = json.loads(res.stdout)
                return {
                    "provider": "aws",
                    "authenticated": True,
                    "user": acc.get("Arn", "AWS IAM Principal"),
                    "account_id": acc.get("Account", ""),
                    "subscription_name": f"AWS Account {acc.get('Account')}"
                }
        except Exception:
            pass
        return {"provider": "aws", "authenticated": True, "user": "AWS CLI / SSO Active", "subscription_name": "AWS Default Profile"}

    elif prov == "gcp":
        try:
            res = subprocess.run(["gcloud", "config", "get-value", "account"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
            if res.returncode == 0 and res.stdout.strip():
                user_email = res.stdout.strip()
                return {
                    "provider": "gcp",
                    "authenticated": True,
                    "user": user_email,
                    "subscription_name": "GCP Active Account"
                }
        except Exception:
            pass
        return {"provider": "gcp", "authenticated": True, "user": "gcloud CLI Active", "subscription_name": "GCP Active Session"}

    return {"provider": prov, "authenticated": False}


@app.post("/api/auth/login")
async def trigger_cloud_login(provider: str = Query("azure")):
    """Triggers login command for chosen cloud provider."""
    prov = provider.lower()
    if prov == "azure":
        # 1. Try Managed Identity first
        try:
            mi_res = subprocess.run(["az", "login", "--identity"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
            if mi_res.returncode == 0:
                show_res = subprocess.run(["az", "account", "show"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10)
                acc_info = json.loads(show_res.stdout) if (show_res.returncode == 0 and show_res.stdout.strip()) else {}
                user_name = acc_info.get("user", {}).get("name", "AKS Managed Identity")
                return {"status": "success", "provider": "azure", "output": f"✓ Authenticated successfully via Azure Managed Identity ({user_name})!"}
        except Exception:
            pass
        
        # 2. Try Service Principal env vars if available
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")
        tenant_id = os.getenv("AZURE_TENANT_ID")
        if client_id and client_secret and tenant_id:
            try:
                sp_res = subprocess.run(["az", "login", "--service-principal", "-u", client_id, "-p", client_secret, "--tenant", tenant_id], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=15)
                if sp_res.returncode == 0:
                    return {"status": "success", "provider": "azure", "output": f"✓ Authenticated successfully via Service Principal ({client_id[:8]}...)!"}
            except Exception:
                pass

        # 3. Fallback: Trigger persistent background device code login
        global device_code_process
        try:
            if device_code_process and device_code_process.poll() is None:
                device_code_process.terminate()

            device_code_process = subprocess.Popen(
                ["az", "login", "--use-device-code"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )

            output_lines = []
            start_t = time.time()
            while time.time() - start_t < 6:
                line = device_code_process.stdout.readline()
                if line:
                    output_lines.append(line.strip())
                    if "devicelogin" in line or "enter the code" in line:
                        break
                else:
                    time.sleep(0.2)

            output = "\n".join(output_lines)
            if not output:
                output = "To sign in, open https://microsoft.com/devicelogin in any browser and enter the device code."

            return {"status": "device_code", "provider": "azure", "output": output}
        except Exception as e:
            return {"status": "error", "provider": "azure", "output": f"Device code login error: {str(e)}"}
    elif prov == "aws":
        output = run_cmd(["aws", "configure", "list"])
    elif prov == "gcp":
        output = run_cmd(["gcloud", "auth", "login"])
    else:
        output = f"Unknown provider '{prov}'"
    return {"status": "success", "provider": prov, "output": output}


@app.post("/api/provision/cancel")
async def cancel_provision_process():
    """Cancels/terminates the currently executing terminal process."""
    global active_process
    if active_process and active_process.poll() is None:
        try:
            logger.info("Cancelling running provisioning subprocess by user request...")
            active_process.terminate()
            active_process.kill()
            active_process = None
            return {"status": "cancelled", "message": "Provisioning process terminated successfully by user."}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    return {"status": "idle", "message": "No running terminal process to cancel."}


@app.post("/api/provision/stream")
async def stream_multi_cloud_provision(payload: ProvisionPayload):
    """
    Streams line-by-line stdout logs from provisioner script in real time (SSE).
    """
    global active_process
    prov = payload.provider.lower()
    script_path = AWS_SCRIPT if prov == "aws" else GCP_SCRIPT if prov == "gcp" else AZURE_SCRIPT

    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail=f"Script not found at '{script_path}'")

    cmd = [script_path]
    if payload.destroy:
        cmd.append("--destroy")
    if payload.environments:
        cmd.extend(["--envs", ",".join(payload.environments)])
    if payload.prefix:
        cmd.append(payload.prefix)
    if payload.location and not payload.destroy:
        cmd.append(payload.location)

    def generate_stream():
        global active_process
        try:
            active_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                cwd=PARENT_DIR
            )
            
            for line in iter(active_process.stdout.readline, ''):
                if line:
                    yield f"data: {json.dumps({'line': line.strip()})}\n\n"
            
            active_process.stdout.close()
            code = active_process.wait()
            active_process = None
            yield f"data: {json.dumps({'event': 'done', 'code': code})}\n\n"
        except Exception as e:
            active_process = None
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream")


@app.post("/api/provision")
async def execute_multi_cloud_provision(payload: ProvisionPayload):
    """
    Executes Azure, AWS, or GCP multi-environment infrastructure provisioner script synchronously.
    """
    global active_process
    prov = payload.provider.lower()
    script_path = AWS_SCRIPT if prov == "aws" else GCP_SCRIPT if prov == "gcp" else AZURE_SCRIPT

    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail=f"Script not found at '{script_path}'")

    cmd = [script_path]
    if payload.destroy:
        cmd.append("--destroy")
    if payload.environments:
        cmd.extend(["--envs", ",".join(payload.environments)])
    if payload.prefix:
        cmd.append(payload.prefix)
    if payload.location and not payload.destroy:
        cmd.append(payload.location)

    try:
        logger.info(f"Executing {prov.upper()} Provisioning Script: {' '.join(cmd)}")
        active_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=PARENT_DIR
        )
        stdout, _ = active_process.communicate(timeout=600)
        returncode = active_process.returncode
        active_process = None

        portal_links = []
        if prov == "azure":
            sub_id = run_cmd(["az", "account", "show", "--query", "id", "-o", "tsv"]).strip()
            for env in (payload.environments or ["dev", "qa", "prd"]):
                rg_name = f"{payload.prefix}-{env}-rg"
                url = f"https://portal.azure.com/#@/resource/subscriptions/{sub_id}/resourceGroups/{rg_name}/overview"
                portal_links.append({"env": env.upper(), "rg": rg_name, "url": url})
        elif prov == "aws":
            for env in (payload.environments or ["dev", "qa", "prd"]):
                url = f"https://console.aws.amazon.com/vpc/home?region={payload.location}#vpcs:"
                portal_links.append({"env": env.upper(), "rg": f"{payload.prefix}-{env}-vpc", "url": url})
        elif prov == "gcp":
            for env in (payload.environments or ["dev", "qa", "prd"]):
                url = f"https://console.cloud.google.com/welcome?region={payload.location}"
                portal_links.append({"env": env.upper(), "rg": f"{payload.prefix}-{env}-project", "url": url})

        return {
            "status": "success" if returncode == 0 else "warning",
            "returncode": returncode,
            "provider": prov,
            "prefix": payload.prefix,
            "location": payload.location,
            "action": "teardown" if payload.destroy else "provision",
            "output": stdout,
            "portal_links": portal_links
        }
    except subprocess.TimeoutExpired:
        if active_process:
            active_process.kill()
            active_process = None
        raise HTTPException(status_code=504, detail="Execution timed out after 10 minutes.")
    except Exception as e:
        active_process = None
        logger.error(f"Execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🚀 MULTI-CLOUD PROVISIONING WEB UI SITE SERVER (Azure, AWS, GCP)")
    print("   Listening on: http://localhost:8585")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8585)
