# 📱 Prompt 4: React Dashboard UI & Custom JWT Auth

<p align="left">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-TypeScript-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-Cyber_Glassmorphism-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-PyJWT_Bcrypt-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>

Create the React frontend in `application/frontend/` with Dark Obsidian & Cyber Neon Glassmorphism UI styling and custom JWT authentication.

## 📌 Requirements

### 1. Setup & Aesthetics
- Vite + React 18 + TypeScript + Tailwind CSS.
- Premium Dark Obsidian glassmorphism theme (`bg-slate-950`, `backdrop-blur-md`, glowing borders).

### 2. Custom JWT Auth
- Backend endpoints:
  - `POST /api/auth/signup` — hashes password with `bcrypt`, creates user in PostgreSQL, returns JWT.
  - `POST /api/auth/login` — validates credentials against PostgreSQL, returns JWT.
- Frontend stores JWT in `localStorage` and injects `Authorization: Bearer <token>` into all Axios requests.

### 3. UI Views & Features
- **Login / Signup Modal**: Sleek form with live input validation.
- **Dashboard**: Cloud resource group dropdown selector, **Execute AI Cost Scan** button, and live WebSocket progress tracker bar.
- **Tag-Based Allocation Drawers**: Resource classification cards by `Environment`, `Department`, `CostCenter`.
- **Infrastructure Drift & Policy Monitor**: Displays compliance comparison against policy baselines.
- **1-Click Fix Remediation Button**: Triggers `POST /api/execute-fix` to execute CLI fixes on Azure/AWS/GCP live.
- **15-Item Paginated History & Audit Log**: Shows past investigations with cumulative $ Saved to Date KPI cards.

---

## 🏗️ Project Structure

```text
application/frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Report.tsx
│   │   └── History.tsx
│   ├── components/
│   │   ├── ProgressTracker.tsx
│   │   ├── TagAllocationDrawer.tsx
│   │   ├── DriftMonitor.tsx
│   │   └── Navbar.tsx
├── package.json
├── tailwind.config.js
└── index.html
```

Refer to [Architecture.MD](file:///Users/aarvik/Documents/123/Architecture.MD) and [RequestFlow.MD](file:///Users/aarvik/Documents/123/RequestFlow.MD).
