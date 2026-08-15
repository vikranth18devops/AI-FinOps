# 08 - Custom Domain & GoDaddy DNS Integration on GCP GKE

<p align="left">
  <img src="https://img.shields.io/badge/GoDaddy-DNS-1B1B1B?style=for-the-badge&logo=godaddy&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-LoadBalancer-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Traefik-Ingress-24A1DE?style=for-the-badge&logo=traefik&logoColor=white" />
</p>

## 📌 Step Overview
Make the FinOps application stack and ArgoCD dashboard reachable via your custom registered domain **`vikranthsunkarpally.in`** instead of raw IP addresses.

- **Before**: `http://<TRAEFIK_PUBLIC_IP>/` and `http://<TRAEFIK_PUBLIC_IP>/argocd/`
- **After**: `http://vikranthsunkarpally.in/` and `http://vikranthsunkarpally.in/argocd/`

---

## ⚡ Step 1: Fetch LoadBalancer Public IP & Add GoDaddy A-Record

### 1a. Read GCP Traefik Public LoadBalancer IP
```bash
export LB_IP=$(kubectl -n ingress-traefik get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "GCP Traefik LoadBalancer IP: ${LB_IP}"
```

### 1b. Add DNS `A` Record in GoDaddy Control Panel
1. Sign into your **[GoDaddy Domain Portfolio](https://account.godaddy.com/products)**.
2. Select domain **`vikranthsunkarpally.in`** -> **DNS / Manage DNS**.
3. Click **Add New Record** and enter the details:

   | Field | Value |
   | :--- | :--- |
   | **Type** | `A` |
   | **Name** | `@` (Root apex domain) |
   | **Value** | Paste your `$LB_IP` from above (e.g., `35.224.38.103`) |
   | **TTL** | `600` (10 minutes) |

4. Save record changes.

---

## 🔍 Step 2: Verify DNS Propagation

Public DNS propagation from GoDaddy to global resolvers typically takes 1 to 5 minutes.

### 2a. Verify with `dig`
```bash
dig +short @8.8.8.8 vikranthsunkarpally.in
```
> Expected Output: Returns a single line matching your `$LB_IP`.

### 2b. Verify with `nslookup`
```bash
nslookup vikranthsunkarpally.in 8.8.8.8
```

---

## ⚡ Step 3: Update Helm Ingress Configuration for Host Matching

Update `chart/values.yaml` and Ingress rules so Traefik routes requests containing `Host: vikranthsunkarpally.in`.

### 3a. Update `chart/values.yaml`
Add `vikranthsunkarpally.in` and your `$LB_IP` to the `ingress.hosts` stanza:

```yaml
ingress:
  enabled: true
  hosts:
    - vikranthsunkarpally.in
    - 35.224.38.103
```

---

## ⚡ Step 4: Commit & Sync via ArgoCD GitOps Loop

Commit and push your updated chart configuration to trigger ArgoCD synchronization:

```bash
git add chart/values.yaml chart/templates/traefik-ingress.yaml
git commit -m "feat(dns): configure custom domain vikranthsunkarpally.in for Traefik Ingress on GKE"
git push origin main
```

To trigger an immediate ArgoCD refresh without waiting for the 3-minute polling cycle:
```bash
kubectl -n argocd annotate app finops-application argocd.argoproj.io/refresh=hard --overwrite
```

Verify sync status:
```bash
kubectl -n argocd get app finops-application
```

---

## 🔍 Step 5: Verify Hostname Access

Test endpoints via `curl` and open them in your browser:

```bash
export HOSTNAME='vikranthsunkarpally.in'

echo "=== Testing Custom Domain Endpoints ==="
curl -s -o /dev/null -w "  /                -> HTTP %{http_code}\n" "http://${HOSTNAME}/"
curl -s -o /dev/null -w "  /argocd/         -> HTTP %{http_code}\n" "http://${HOSTNAME}/argocd/"
curl -s -o /dev/null -w "  /api/health      -> HTTP %{http_code}\n" "http://${HOSTNAME}/api/health"
```

All requests should return **`HTTP 200`**.

### Open Endpoints in Browser:
- **Application Dashboard**: `http://vikranthsunkarpally.in/`
- **ArgoCD Dashboard**: `http://vikranthsunkarpally.in/argocd/` *(trailing slash required)*
- **Provisioner Studio**: `http://vikranthsunkarpally.in/studio`

---

## ⚡ Step 6: (Optional) Reserve GCP Static External IP Address

By default, GCP assigns an ephemeral LoadBalancer IP. To prevent IP changes if Traefik is redeployed, promote your public IP to a GCP Static External IP:

```bash
export LB_IP=$(kubectl -n ingress-traefik get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Reserve static external IP address in GCP
gcloud compute addresses create traefik-static-pip \
  --addresses=$LB_IP \
  --region=us-central1
```

---

## 🛠️ Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| `dig` returns no record after 10+ min | GoDaddy DNS record saved under wrong zone | Verify A-record `Name = @` and `Value = <LB_IP>` in GoDaddy control panel. |
| Hostname resolves, but returns `404 Not Found` | Traefik Ingress missing host rule | Check `kubectl get ingress -n finops` and ensure `vikranthsunkarpally.in` is listed in host rules. |
| ArgoCD UI assets return 404 | Missing trailing slash in URL | Always access ArgoCD at `http://vikranthsunkarpally.in/argocd/` (with trailing slash). |

---

Next Step: **[09-Observability Stack on GKE](09-observability-gcp.md)**
