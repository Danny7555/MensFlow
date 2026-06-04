# MensFlow API Integration — Current State 🚀

[← Back to README](README.md) | [← Back to Docs](README.md#-table-of-contents)

The backend is **implemented and live**. This doc reflects what exists now, what is in-flight, and what remains planned. For the original migration plan, see the git history of this file.

---

## ✅ Implemented Endpoints (as of June 2026)

### Auth (`backend/src/routes/auth.ts` · `backend/src/services/auth.ts`)
- `POST /api/auth/register` — create account, cycle baseline
- `POST /api/auth/login` — JWT login
- `POST /api/auth/verify-otp` — OTP step for registration
- `POST /api/auth/resend-otp` — resend code

### Cycle & Logs (`backend/src/routes/cycle.ts` · `backend/src/controllers/cycle.ts`)
- `GET /api/cycle/logs` — fetch all logs for authenticated user
- `POST /api/cycle/logs` — create or upsert daily log (symptoms + metrics)
- `GET /api/cycle/logs/custom` — fetch custom symptom definitions
- `GET /api/cycle/logs/review` — period review summary

### Partner (`backend/src/routes/partner.ts` · `backend/src/services/partner.ts`)
- `GET /api/partner/status` — connection state
- `POST /api/partner/pair` — link partner accounts
- `POST /api/partner/invite` — email invite (Nodemailer)
- `POST /api/partner/ping` — send status check-in
- `GET /api/partner/chat` — fetch chat history
- `POST /api/partner/action` — log support action

### Dashboard (`backend/src/routes/user.ts` · `backend/src/controllers/user.ts`)
- `GET /api/dashboard` — cycle baseline + computed stats
- `PATCH /api/dashboard` — update cycle parameters

### Support Actions & Streaks (`backend/src/routes/support.ts`)
- `GET /api/support/streak` — current streak + last action date
- `POST /api/support/actions` — toggle gesture completion

### Education & Wellness Tips (`backend/src/routes/education.ts`, `backend/src/routes/wellnessTip.ts`)
- `GET /api/education` — article list (access-level-gated)
- `GET /api/wellness-tips` — phase-tagged tips

---

## ⚡ Current Cross-Tab Sync (Local)

Since the frontend is still migrating from localStorage, partner pings use **cross-tab localStorage events** inside the same browser:

```mermaid
sequenceDiagram
    participant Partner Tab
    participant localStorage
    participant Tracker Tab

    Partner Tab->>localStorage: setItem('mensflow_partner_ping:v1', JSON)
    localhost-->>Tracker Tab: 'storage' event
    Tracker Tab->>Tracker Tab: sonner toast
    ```

---

## 🔒 Chat Security (Current / Planned)

- **Current:** Locked chat writes to `mensflow_locked_chats` in localStorage. No encryption at rest.
- **Planned (feature/add-lock-chat):** Client-side AES-GCM via `crypto.subtle`. Key derived from passcode, encrypt message array before POST to `/api/chats/locked`. Backend stores only ciphertext.

---

## 🛜 Network Resilience

- **Optimistic UI:** State updates before the API call returns. On failure: rollback + toast.
- **Offline queue (planned):** IndexedDB sync queue + service worker flush on reconnect.
- **Auth expiry:** 401 → `mf:auth:expired` event → logout.

