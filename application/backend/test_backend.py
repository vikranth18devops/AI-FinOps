import unittest
import sys
import os
import asyncio
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from azure_scanner import (
    AzureCLINotInstalledError,
    AzureCLINotLoggedInError,
    ResourceGroupNotFoundError
)
from ai_analyzer import AIAnalyzerError, analyze_resources
from db import init_db, save_analysis, get_user_analyses, create_user
from auth import create_access_token

client = TestClient(app)


class TestFastAPIBackend(unittest.TestCase):

    def setUp(self):
        # Create helper test user token for authenticated endpoints
        asyncio.run(init_db())
        self.test_token = create_access_token(user_id=1, email="test@example.com")
        self.auth_headers = {"Authorization": f"Bearer {self.test_token}"}

    def test_root_endpoint(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")

    def test_unauthenticated_request_fails(self):
        response = client.get("/api/resource-groups")
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("missing", data["detail"].lower())

    def test_signup_and_login_flow(self):
        email = f"user_{Math_rand()}@example.com"
        password = "secretpassword123"

        signup_res = client.post("/api/auth/signup", json={"email": email, "password": password})
        self.assertEqual(signup_res.status_code, 200)
        signup_data = signup_res.json()
        self.assertEqual(signup_data["status"], "success")
        self.assertIn("token", signup_data)
        token = signup_data["token"]

        dup_res = client.post("/api/auth/signup", json={"email": email, "password": password})
        self.assertEqual(dup_res.status_code, 400)

        login_res = client.post("/api/auth/login", json={"email": email, "password": password})
        self.assertEqual(login_res.status_code, 200)

        history_res = client.get("/api/history", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(history_res.status_code, 200)

    @patch("azure_scanner._run_az_cmd")
    def test_get_resource_groups_success(self, mock_az_cmd):
        mock_az_cmd.return_value = [
            {
                "id": "/subscriptions/sub-123/resourceGroups/rg-demo-1",
                "location": "eastus",
                "name": "rg-demo-1",
                "tags": {"env": "prod"},
                "properties": {"provisioningState": "Succeeded"}
            }
        ]

        response = client.get("/api/resource-groups", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["resource_groups"][0]["name"], "rg-demo-1")

    @patch("ai_analyzer.OpenAI")
    @patch("azure_scanner._run_az_cmd")
    def test_analyze_resource_group_with_ai_analysis(self, mock_az_cmd, mock_openai_cls):
        mock_az_cmd.return_value = [
            {
                "id": "/subscriptions/sub-123/resourceGroups/rg-demo-1/providers/Microsoft.Compute/virtualMachines/vm-prod-01",
                "name": "vm-prod-01",
                "type": "Microsoft.Compute/virtualMachines",
                "location": "eastus",
                "sku": {"name": "Standard_D4s_v3"},
                "tags": {"Owner": "DevTeam"},
                "resourceGroup": "rg-demo-1"
            }
        ]

        mock_openai_inst = MagicMock()
        mock_openai_cls.return_value = mock_openai_inst

        mock_choice = MagicMock()
        mock_choice.message.content = '''
        {
          "summary": "Detected 1 cost optimization opportunity.",
          "total_estimated_monthly_savings": "$60.00/month",
          "issues": [
            {
              "id": "issue-1",
              "title": "Over-provisioned VM Instance",
              "category": "Over-provisioning",
              "severity": "high",
              "affected_resource": "vm-prod-01",
              "description": "VM standard size can be safely reduced.",
              "estimated_savings": "$60.00/month",
              "fix_command": "az vm resize --resource-group rg-demo-1 --name vm-prod-01 --size Standard_B2s"
            }
          ],
          "recommendations": [
            "Enable auto-shutdown."
          ]
        }
        '''
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_openai_inst.chat.completions.create.return_value = mock_response

        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key-123"}):
            response = client.post(
                "/api/analyze",
                json={"resource_group": "rg-demo-1", "analysis_id": "test-id-100"},
                headers=self.auth_headers
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["analysis_id"], "test-id-100")
        self.assertEqual(data["resource_group"], "rg-demo-1")
        self.assertEqual(data["total_resources"], 1)

    def test_websocket_progress_connection(self):
        with client.websocket_connect("/ws/progress/test-analysis-999") as websocket:
            websocket.send_text("ping")
            data = websocket.receive_json()
            self.assertEqual(data["status"], "connected")
            self.assertEqual(data["analysis_id"], "test-analysis-999")

    def test_database_and_history(self):
        async def run_db_test():
            await init_db()
            saved = await save_analysis(
                analysis_id="hist-test-1",
                resource_group="rg-history-test",
                resources_scanned=3,
                issues_found=1,
                estimated_savings="$45.00/month",
                analysis_result={"summary": "History test summary"},
                user_id=1
            )
            self.assertEqual(saved["id"], "hist-test-1")

            history = await get_user_analyses(user_id=1)
            self.assertTrue(any(item["id"] == "hist-test-1" for item in history))

        asyncio.run(run_db_test())

        response = client.get("/api/history", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(data["total"], 1)


def Math_rand():
    import random
    return str(random.randint(1000, 9999))


if __name__ == "__main__":
    unittest.main()
