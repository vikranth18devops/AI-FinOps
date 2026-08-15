# 08 - Custom Domain Apex via Route 53 & GoDaddy Delegation on AWS EKS

<p align="left">
  <img src="https://img.shields.io/badge/Amazon_Route_53-DNS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/GoDaddy-Delegation-1B1B1B?style=for-the-badge&logo=godaddy&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_AWS-NLB_ELB-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/Traefik-Ingress-24A1DE?style=for-the-badge&logo=traefik&logoColor=white" />
</p>

## 📌 Step Overview
Serve the platform on your bare **apex domain `vikranthsunkarpally.in`** (no subdomains required) on AWS EKS.

- **Before**: `http://k8s-traefik-traefik-abc123.elb.us-east-1.amazonaws.com/`
- **After**: `http://vikranthsunkarpally.in/` and `http://vikranthsunkarpally.in/argocd/`

---

## 🏗️ Why We Use Route 53 + GoDaddy Delegation

An AWS Network Load Balancer (NLB) provisions a **DNS hostname**, not a fixed static IP:
```text
k8s-traefik-traefik-abc123.elb.us-east-1.amazonaws.com
```

Standard DNS rules state:
- A **subdomain** (`app.vikranthsunkarpally.in`) can use a `CNAME` record to point to an NLB hostname.
- The **root apex** (`vikranthsunkarpally.in`) **CANNOT** be a `CNAME` — and standard GoDaddy DNS has no `ALIAS` record type for apex domain CNAME flattening.

To solve this, **Amazon Route 53** manages the hosted zone with an **ALIAS A** record pointing directly to the Traefik NLB. **GoDaddy remains your domain registrar**, and we delegate domain nameservers to Route 53.

```text
GoDaddy (Registrar)  ──(Delegate NS)──►  Route 53 Hosted Zone (vikranthsunkarpally.in)
   (Manual Setup)                                │  ALIAS A  @  ──►  Traefik NLB
                                                 ▼
                                           Traefik NLB  ──►  EKS Cluster
```

---

## ⚡ Step 1: Obtain Route 53 Nameservers

Create or query the Route 53 hosted zone for `vikranthsunkarpally.in` and retrieve its 4 authoritative name servers:

```bash
export DOMAIN_NAME="vikranthsunkarpally.in"

# 1. Create Route 53 Hosted Zone (if not already created)
aws route53 create-hosted-zone --name "$DOMAIN_NAME" --caller-reference "$(date +%s)"

# 2. Get Hosted Zone ID
export ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN_NAME" --query "HostedZones[0].Id" -o tsv | cut -d'/' -f3)

# 3. Retrieve the 4 Route 53 Name Servers
aws route53 get-hosted-zone --id "$ZONE_ID" --query "DelegationSet.NameServers" -o tsv
```

Example Output:
```text
ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-901.awsdns-12.org
ns-234.awsdns-56.co.uk
```

---

## ⚡ Step 2: Delegate GoDaddy Nameservers to Route 53 (Manual, 1-Time Setup)

GoDaddy remains your domain **registrar**, while Route 53 acts as your **DNS host**:

1. Sign in to **[GoDaddy Domain Portfolio](https://account.godaddy.com/products)**.
2. Select domain **`vikranthsunkarpally.in`** -> **DNS / Manage DNS** -> **Nameservers**.
3. Click **Change Nameservers** -> **Enter my own nameservers (advanced)**.
4. Replace existing GoDaddy nameservers with the **4 Route 53 Name Servers** from Step 1.
5. Save changes.

Verify DNS delegation propagation using `dig`:
```bash
dig +short NS vikranthsunkarpally.in
```
> Expected Output: Lists `ns-*.awsdns-*.com/net/org/co.uk` servers.

---

## ⚡ Step 3: Create Apex ALIAS Record Pointing to Traefik NLB

Fetch Traefik's Network Load Balancer hostname from EKS and create the Route 53 **ALIAS A** record:

```bash
# 1. Read Traefik NLB Hostname from EKS
export NLB_HOST=$(kubectl -n ingress-traefik get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Traefik NLB Hostname: ${NLB_HOST}"

# 2. Read Hosted Zone ID
export ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "vikranthsunkarpally.in" --query "HostedZones[0].Id" -o tsv | cut -d'/' -f3)

# 3. Fetch NLB Hosted Zone ID (us-east-1 NLB canonical zone ID is Z26RNN25G1864A)
export NLB_ZONE_ID="Z26RNN25G1864A"

# 4. Create Route 53 ALIAS A Record JSON payload
cat <<EOF > /tmp/route53-alias.json
{
  "Comment": "Create ALIAS A record for apex domain pointing to Traefik NLB",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "vikranthsunkarpally.in.",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${NLB_ZONE_ID}",
          "DNSName": "dualstack.${NLB_HOST}.",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

# 5. Apply ALIAS Record in Route 53
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch file:///tmp/route53-alias.json
```

---

## 🔍 Step 4: Verify Apex DNS Resolution

Check that your apex domain `vikranthsunkarpally.in` resolves to the NLB IP addresses:

```bash
# Query A record
dig +short vikranthsunkarpally.in

# Query nslookup
nslookup vikranthsunkarpally.in
```
> Expected Output: Returns active AWS NLB IP addresses (e.g. `52.x.x.x`, `3.x.x.x`).

---

## ⚡ Step 5: Update Helm Ingress Configuration for Host Matching

Update `chart/values.yaml` so Traefik routes requests containing `Host: vikranthsunkarpally.in`:

```yaml
ingress:
  enabled: true
  className: traefik
  host: vikranthsunkarpally.in
```

---

## ⚡ Step 6: Sync via ArgoCD GitOps Loop

Commit and push your updated chart configuration, then trigger an immediate ArgoCD refresh:

```bash
git add chart/values.yaml
git commit -m "feat(dns): configure custom domain vikranthsunkarpally.in for Traefik Ingress on EKS"
git push origin main

# Trigger hard refresh in ArgoCD
kubectl -n argocd annotate app finops-application argocd.argoproj.io/refresh=hard --overwrite
```

---

## 🔍 Step 7: Verify Apex Endpoints Access

Test endpoints via `curl` and open them in your browser:

```bash
export HOSTNAME_APP='vikranthsunkarpally.in'

echo "=== Testing Custom Domain Apex Endpoints ==="
curl -s -o /dev/null -w "  /           -> HTTP %{http_code}\n" "http://${HOSTNAME_APP}/"
curl -s -o /dev/null -w "  /argocd/    -> HTTP %{http_code}\n" "http://${HOSTNAME_APP}/argocd/"
curl -s -o /dev/null -w "  /api/health -> HTTP %{http_code}\n" "http://${HOSTNAME_APP}/api/health"
```

All requests should return **`HTTP 200`**.

### Open Endpoints in Browser:
- **Application Dashboard**: `http://vikranthsunkarpally.in/`
- **ArgoCD Dashboard**: `http://vikranthsunkarpally.in/argocd/` *(trailing slash required)*
- **Provisioner Studio**: `http://vikranthsunkarpally.in/studio`

---

## 🛠️ Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| `dig NS vikranthsunkarpally.in` returns `domaincontrol.com` | GoDaddy NS delegation pending | Ensure all 4 Route 53 Name Servers are entered in GoDaddy control panel and allow propagation time. |
| `dig vikranthsunkarpally.in` returns no IP | Route 53 ALIAS record missing | Re-run Step 3 script to upsert ALIAS record in Route 53. |
| Hostname resolves, but returns `404 Not Found` | Traefik Ingress missing host rule | Verify `chart/values.yaml` contains `host: vikranthsunkarpally.in` and hard-refresh ArgoCD. |

---

Next Step: **[09-Observability Stack on EKS](09-observability-aws.md)**
