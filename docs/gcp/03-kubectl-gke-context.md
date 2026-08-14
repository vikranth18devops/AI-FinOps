# 03 - Connect Kubectl Context to GCP GKE

## 📌 Step Overview
Bind your local `kubectl` CLI context to your **GKE Autopilot** cluster using the `gcloud` SDK.

---

## ⚡ Connection Command

```bash
gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" --region us-central1
```

---

## 🔍 Verification Command

```bash
kubectl get nodes -o wide
```

---

Next Step: **[04-Namespaces & Workload Identity](04-namespaces-and-rbac.md)**
