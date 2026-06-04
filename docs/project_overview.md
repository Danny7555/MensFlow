# MensFlow Project Overview & System Architecture 🌸

[← Back to README](README.md) | [Full docs index](README.md)

This document captures the **actual** current architecture of MensFlow — a dual-audience menstrual health platform built with React 19, Express, and MongoDB. It replaces the original aspirational blueprint with the real stack, folder layout, and data flow as of June 2026.

---

## 🎯 Mission

MensFlow tracks menstrual cycles and translates biological changes into empathetic, actionable support for partners. It targets both **Ghanaian adolescent health education** and **general relationship wellness**, with strict privacy controls (passcode-vault chats, local-only storage toggle, partner access-level gates).

---

## 🏗️ Actual Architecture (3 Layers)

```
┌──────────────┐      HTTPS / REST      ┌──────────────┐      MongoDB      ┌──────────────┐
│              │ ─────────────────────▶ │              │ ───────────────▶ │              │
│  Frontend    │                        │  Backend     │                  │   Database   │
│  (React 19)  │◀───────────────────── │  (Express)   │◀───────────────── │  (Mongoose)  │
│  Port: 5173  │                        │  Port: 5001  │                  │              │
└──────────────┘                        └──────────────┘                  └──────────────┘
```

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | React 19 · TypeScript · Vite · React Router v7 | `frontend/` |
| Backend | Express · TypeScript · ts-node-dev · node-cron | `backend/` |
| Database | MongoDB via Mongoose 8.x | `backend/src/models/` |

---

## 🔄 Data Flow (Current Hybrid Mode)

The frontend is **mid-migration** from localStorage-only to full backend sync:

```
Component → Zustand Action
  ├── Optimistic UI update (immediate)
  ├── HTTP call via services/ (Bearer JWT header)
  │     ├── Success → merge server state
  │     └── 401 → emit mf:auth:expired → logout
  └── Fallback: localStorage persist (user settings, UI prefs)
```

- **Local-only fields** (sidebarCollapsed, themeMode) → `localStorage` only via Zustand persist
- **Remote fields** (logs, dashboard metrics, support streaks) → REST API → MongoDB
- **Partner pings** → localStorage cross-tab events (`mensflow_partner_ping:v1`) until WebSocket migration lands

---

## 📂 Repository Layout

```
MensFlow/
├── README.md
├── docs/
│   ├── project_overview.md          ← this file
│   ├── routing_and_auth_guards.md
│   ├── api_integration_blueprint.md
│   ├── cycle_and_state_architecture.md
│   ├── mock_api_sandbox.md
│   ├── theme_and_design_system.md
│   └── collaboration_guide.md
│
├── backend/
│   ├── src/
│   │   ├── config/                   # MongoDB, mailer, rate limiter, env
│   │   ├── controllers/              # auth, cycle, chat, education, email, partner, user, wellnessTip
│   │   ├── interfaces/               # TypeScript types
│   │   ├── middleware/               # authenticate (JWT), rateLimiter, errors
│   │   ├── models/                   # User, Chat, Partner, Log, Dashboard, Settings,
│   │   │                             # Symptom, EducationArticle, WellnessTip, LoginHistory
│   │   ├── routes/                   # auth, cycle, partner, scheduler, user, support,
│   │   │                             # education, wellnessTip
│   │   ├── services/                 # auth (OTP flow), cycle, chat, email (Nodemailer),
│   │   │                             # partner, scheduler (node-cron), user
│   │   ├── utils/                    # cycleUtils (the backend equivalent),
│   │   │                             # http, validators, seeders
│   │   └── index.ts                  # Express server entry
│   ├── vercel.json                   # Serverless + cron webhook route
│   └── migrations/                   # (schema history)
│
└── frontend/
    ├── src/
    │   ├── views/                    # 15 lazy-loaded pages (see README.md for details)
    │   ├── components/
    │   │   ├── dashboard/            # DailyCheckIn, FeedSection, EmotionTranslator,
    │   │   │                         # Stories, WellnessScoreCard, PrimaryInsightCard,
    │   │   │                         # BodySignalsCard, DailyTipCard, HormoneInsightCard
    │   │   ├── tracker/              # CycleWheel, CycleStatsHero, HealthMetrics,
    │   │   │                         # CycleHistory, CycleLogs, CycleTips
    │   │   ├── skeletons/            # PageLoader + per-view loaders
    │   │   └── ui/                   # shadcn-style atoms (Card, Button, Input, Modal,
    │   │                            # Select, Tooltip, Popover, Dialog, Calendar)
    │   ├── context/                  # AuthProvider, ChatSessionContext, SettingsProvider
    │   ├── services/                 # auth, chat, logs, partner, user, tips, education
    │   ├── store/useStore.ts         # Zustand single source of truth
    │   ├── lib/                      # apiClient, cycleUtils, theme, passwordStrength,
    │   │                           # constants
    │   ├── hooks/                    # useMediaQuery, useSmartPushNotifications
    │   │                           # useMonthInReview (TipsView)
    │   ├── data/                     # symptomsData, tips, education, onboarding seeds
    │   ├── types/                    # TypeScript interfaces
    │   ├── App.tsx                   # Router (15 lazy routes) + ChatLockGate guard
    │   ├── App.css                   # .app-shell, .app-main layout helpers
    │   ├── index.css                 # Tailwind base + CSS Design Tokens
    │   └── main.tsx                  # bootstrap
    └── package.json
```

---

## 🧮 Cycle Calculation Engine

`frontend/src/lib/cycleUtils.ts` is the authoritative frontend cycle math; an equivalent model exists in `backend/src/utils/cycleUtils.ts` for server-side validation.

**Phase thresholds** (current implementation, cycle-length-aware):

- Period: 4 days (≤24), 5 days (25–35), 6 days (≥36)
- Ovulation: `max(periodLen + 5, cycleLen - 14)` days
- Fertile window: ovulation −4 → ovulation +2
- Luteal: fertileEnd + 1 → cycleLen

| Phase | Color | UI Feel |
|-------|-------|---------|
| `menstrual` | `#f43f5e` | Warm rose glow |
| `follicular` | `#0d9488` | Teal/emerald |
| `fertile` | `#26899e` | Sky-blue / cyan |
| `luteal` | `#d97706` | Amber/yellow |

---

## 🔐 Privacy & Security Model

- **Partner access levels:** `full` vs `educational` (the latter restricts log access for Ghanaian health-education use cases)
- **Passcode vault:** chats isolated into `mensflow_locked_chats` localStorage key; client-side AES-GCM (planned) before upload
- **Local strict mode:** `privacyStrictLocalOnly` in settings → never send data to server
- **Token expiry:** 401 responses auto-expire the session via `mf:auth:expired` event

---

## 🚀 Active Feature Branches (June 2026)

| Branch | Status |
|--------|--------|
| `main` | Production-stable |
| `feature/integrate-backend` | Full backend sync wiring |
| `feature/migrate-tanstack-query` | Replace manual fetch with RTK Query |
| `feature/add-lock-chat` | Passcode + security question recovery |
| `feature/user-avatar-upload` | Profile image upload to backend |
| `feature/add-privacy-terms` | Terms/privacy screen |
| `feature/home-ui-responsive` | Mobile-first layout refinements |
| `feautre/implement-email-remainder-otp` | OTP email reminders | utilizes **MongoDB** for flexible data management. This schema stores:
*   User profiles, typical period lengths, and configurations.
*   Historical logs (symptom IDs, custom symptoms, flows, moods).
*   AI-generated wellness predictions.
*   Aggregated metrics for health tracking reports.

---

## 🔒 Privacy, Data Security, & UX States

### Two Core User Experiences
1.  **Unauthenticated Experience (Guest Mode):** Allows users to explore navigation tabs, view general reproductive articles, test log metrics stored in local storage, and trial AI companion chats.
2.  **Authenticated Experience (Logged-In Mode):** Activates secure database saving, historical logs, cycle statistics over 6 months, partner-sync dashboards, and locked chat vaults.

### Privacy Measures
*   **Encrypted Connections:** All remote communications route over secure HTTPS protocols.
*   **Locked Chats module:** Restricts sensitive chat records behind custom local passcodes and security questions. 
*   **Restricted AI Training:** Restricts training models on chats generated inside temporary sandboxes.
*   *See [`docs/routing_and_auth_guards.md`](https://github.com/dadaxlabs/mensflow/blob/main/docs/routing_and_auth_guards.md) for routing security guides.*

---

## 🤝 Development Methodology & Team Roles

MensFlow is developed using the **Agile software development methodology**, deploying features in incremental sprints. Each sprint includes designing, coding, linting, typechecking, and deploying.
*   *See [`docs/collaboration_guide.md`](https://github.com/dadaxlabs/mensflow/blob/main/docs/collaboration_guide.md) for branching, testing, and PR guidelines.*

### 🌸 Project Team & Roles

*   **Liezah Attakorah-Amaniampong** — Project Manager
*   **Adwoa Yeboah** — Innovative Manager
*   **Abigail Edem Hayibor** — Product Designer
*   **Daniella Asiedu** — Product Designer and Developer
