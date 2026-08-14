# 🛡️ Enterprise Security & RBAC Hardening Architecture Guide
## AI Cloud Cost Detective & FinOps Intelligence Platform

> **Document Focus**: Security, Identity, Role-Based Access Control (RBAC), Least Privilege, and Enterprise Guardrails  
> **Target Audience**: Chief Information Security Officer (CISO), Cloud Security Engineers, DevOps Security Leads  
> **Applies to Cloud Environments**: Azure AKS, AWS EKS, GCP GKE, and In-Cluster Kubernetes Workloads  

---

## 📋 Table of Contents
1. [Cloud IAM & Least Privilege Roles (Azure, AWS, GCP)](#1-cloud-iam--least-privilege-roles-azure-aws-gcp)
2. [Kubernetes In-Cluster RBAC Architecture](#2-kubernetes-in-cluster-rbac-architecture)
3. [API Command Execution & Input Sanitization Security](#3-api-command-execution--input-sanitization-security)
4. [Secrets Management & Credential Hardening](#4-secrets-management--credential-hardening)
5. [Network Security, Ingress TLS & ClusterIP Isolation](#5-network-security-ingress-tls--clusterip-isolation)
6. [Container Runtime Hardening & Non-Root Execution](#6-container-runtime-hardening--non-root-execution)
7. [Audit Logging & Security Accountability](#7-audit-logging--security-accountability)

---

## 1. Cloud IAM & Least Privilege Roles (Azure, AWS, GCP)

### 🟦 1.1 Azure IAM & RBAC Roles
The Azure CLI scanner inherits the security context of the logged-in user or Managed Service Identity (MSI).

| Role Name | Scope | Purpose |
| :--- | :--- | :--- |
| **`Reader`** | Subscription / Resource Group | Allows `az resource list` to read live resource metadata without write permissions. |
| **`Cost Management Reader`** | Subscription Level | Read-only access to Azure Consumption & Billing APIs. |
| **`Virtual Machine Contributor`** | Target Resource Group | Scoped execution for VM deallocation (`az vm deallocate`). |
| **`Tag Contributor`** | Target Resource Group | Allows remediating untagged resources (`az storage account update --set tags...`). |

```bash
# Assign Scoped Reader Role to Service Principal
az role assignment create \
  --assignee "<SERVICE_PRINCIPAL_APP_ID>" \
  --role "Reader" \
  --scope "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/aarvikfunc_group"
```

---

### 🟧 1.2 AWS IAM Roles for Service Accounts (IRSA)
EKS pods use IAM Roles for Service Accounts (IRSA) via OIDC federated identity instead of long-lived AWS IAM access keys.

```hcl
# Terraform IRSA Role for EKS Backend Pods
resource "aws_iam_role" "finops_backend_irsa" {
  name = "finops-backend-irsa-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = module.eks.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${module.eks.oidc_issuer_url}:sub": "system:serviceaccount:finops:finops-backend-sa"
        }
      }
    }]
  })
}
```

---

### 🟩 1.3 GCP Workload Identity
GKE Autopilot pods use Workload Identity to bind Kubernetes ServiceAccounts (`finops-backend-sa`) directly to GCP IAM Service Accounts with scoped `roles/compute.viewer` permissions.

---

## 2. Kubernetes In-Cluster RBAC Architecture

The platform implements strict Kubernetes RBAC manifests (`ServiceAccount`, `ClusterRole`, `ClusterRoleBinding`) restricting in-cluster pod permissions:

### 2.1 Backend ServiceAccount Manifest (`chart/templates/rbac.yaml`)
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: finops-backend-sa
  namespace: finops
  annotations:
    azure.workload.identity/client-id: "<AZURE_CLIENT_ID>"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: finops-read-only-role
rules:
  - apiGroups: [""]
    resources: ["pods", "nodes", "namespaces"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: finops-backend-rb
subjects:
  - kind: ServiceAccount
    name: finops-backend-sa
    namespace: finops
roleRef:
  kind: ClusterRole
  name: finops-read-only-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 3. API Command Execution & Input Sanitization Security

To prevent arbitrary remote code execution (RCE) or shell injection attacks via the `/api/execute-fix` endpoint, the FastAPI backend enforces 3 strict security bounds:

1. **Prefix Whitelist Enforcement**:
   ```python
   cmd_str = request.command.strip()
   if not cmd_str.startswith("az "):
       raise HTTPException(status_code=400, detail="Security Error: Only valid Azure CLI ('az') commands allowed.")
   ```
2. **Safe Tokenization (`shlex.split`)**:
   Subprocess execution passes tokenized argument arrays directly to `subprocess.run()`, bypassing shell invocation (`shell=False`) to prevent shell metacharacter injection (e.g. `; rm -rf /`).
3. **JWT Authentication Guardrails**:
   Every fix execution requires a valid, unexpired JWT Bearer token signed with HMAC-SHA256.

---

## 4. Secrets Management & Credential Hardening

- **Zero Plaintext Passwords**: Database passwords and JWT secret keys are injected as Kubernetes `Secrets` (`postgres-secret`) via environment variables or volume mounts.
- **Password Hashing**: User authentication passwords are hashed using `bcrypt` with 12 rounds before database insertion (`hash_password()` in `backend/auth.py`).

---

## 5. Network Security, Ingress TLS & ClusterIP Isolation

```
[Internet] --> [Traefik Ingress (TLS 443)] --> [React Frontend (ClusterIP:80)]
                                           --> [FastAPI Backend (ClusterIP:8000)]
                                                        |
                                            [Internal ClusterIP Only]
                                                        v
                                            [PostgreSQL StatefulSet (Port 5432)]
```

- **PostgreSQL Isolation**: The PostgreSQL StatefulSet service is exposed exclusively via `ClusterIP` (`postgres-service.finops.svc.cluster.local:5432`). It has **zero public IP exposure** and is inaccessible outside the Kubernetes cluster.
- **Ingress TLS/SSL Termination**: Traefik automatically terminates HTTPS traffic on port 443 using TLS certificates (`finops-tls-cert`).

---

## 6. Container Runtime Hardening & Non-Root Execution

Both Frontend and Backend Docker images enforce container security contexts:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: false
```

---

## 7. Audit Logging & Security Accountability

Every executed remediation fix records:
- **`user_id` & `user_email`**: Authenticated engineer identity.
- **`command`**: Full CLI fix string executed.
- **`resource_group`**: Target cloud boundary.
- **`timestamp`**: UTC execution time.
- **`output`**: Exact terminal stdout/stderr payload.

This ensures full auditability for ISO-27001, SOC2, and PCI-DSS compliance audits.
