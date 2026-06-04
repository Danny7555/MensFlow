# MensFlow Project Overview & System Architecture 🌸

[← Back to README](README.md)

MensFlow is a dual-audience menstrual health platform built with **React 19**, **Express**, and **MongoDB**. This document explains the actual architecture, data flow, roles, and folder layout as of June 2026.

---

## 🎯 Mission

MensFlow tracks menstrual cycles and translates biological changes into empathetic, actionable support for partners. It targets both **Ghanaian adolescent health education** and **general relationship wellness**, with strict privacy controls (passcode-vault chats, local-only storage toggle, partner access-level gates).

---

## 🏗️ Architecture (3 Layers)

```
 MENFLOW SYSTEM
 ┌──────────────┐      HTTPS      ┌──────────────┐      MongoDB      ┌──────────────┐
 │   FRONTEND   │ ──────────────▶ │   BACKEND    │ ────────────────▶ │  DATABASE    │
 │  (localhost  │◀────────────── │  (localhost  │◀──────────────── │  (Mongoose)  │
 │   :5173)    │                │   :5001)     │                  │              │
 │              │                │              │                  │              │
 │  React 19    │                │  Express     │                  │  Users        │
 │  Router v7   │                │  JWT + bcrypt│                  │  Logs         │
 │  Zustand     │                │  Nodemailer  │                  │  Partners     │
 │  TanStack    │                │  node-cron   │                  │  Chats        │
 │  Recharts    │                │  OTP flow    │                  │  Settings     │
 └──────────────┘                └──────────────┘                  └──────────────┘
```

### What runs where

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React 19 · TypeScript · Vite · React Router v7 | `5173` |
| Backend | Express · TypeScript · ts-node-dev | `5001` |
| Database | MongoDB via Mongoose 8.x | — |

---

## 🔄 Data Flow (Hybrid Mode)

The frontend is **mid-migration** from localStorage-only to full backend sync:

```
Component → Zustand Action
  ├── Optimistic UI update (immediate)
  ├── HTTP call via services/ (Bearer JWT header)
  │     ├── Success → merge server state
  │     └── 401 → emit mf:auth:expired → logout
  └── Fallback: localStorage persist (UI prefs only)
```

- **Local-only fields** (sidebarCollapsed, themeMode) → `localStorage` only
- **Remote fields** (logs, dashboard metrics, support streaks) → REST API → MongoDB
- **Partner pings** → localStorage cross-tab events (`mensflow_partner_ping:v1`) until WebSocket migration lands

---

## 📂 Folder Layout

```
MensFlow/
├── README.md
├── docs/
└── backend/
    └── src/
        ├── config/           # env, DB, mailer, rate limiter
        ├── controllers/      # auth, cycle, chat, partner, user, tips, education
        ├── middleware/       # JWT auth, errors
        ├── models/           # User, Chat, Partner, Log, Dashboard, Settings,
        │                     # Symptom, EducationArticle, WellnessTip, LoginHistory
        ├── routes/           # auth, cycle, partner, scheduler, user, support,
        │                     # education, wellnessTip
        ├── services/         # auth (OTP), cycle, chat, email, partner,
        │                     # scheduler, user
        └── index.ts          # server entry + CORS
└── frontend/
    └── src/
        ├── views/           # 15 lazy-loaded pages
        ├── components/
        │   ├── dashboard/   # DailyCheckIn, FeedSection, EmotionTranslator, Stories
        │   ├── tracker/     # CycleWheel, CycleStatsHero, HealthMetrics,
        │   │                 # CycleHistory, CycleLogs, CycleTips
        │   ├── skeletons/   # loading states
        │   └── ui/          # Card, Button, Input, Modal, Select, Dialog, Calendar
        ├── context/         # AuthProvider, ChatSessionContext, SettingsProvider
        ├── services/        # auth, chat, logs, partner, user, tips, education
        ├── store/useStore.ts
        ├── lib/             # apiClient, cycleUtils, theme, passwordStrength
        ├── hooks/           # useMediaQuery, useSmartPushNotifications
        ├── data/            # symptoms, tips, education, onboarding seeds
        └── App.tsx          # router + guards
```

---

## 🔐 Auth & Access Levels

```
                         ┌──────────────────┐
                         │   AUTH STATE      │
                         └────────┬─────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   ▼              ▼              ▼
               GUEST          TRACKER         PARTNER
          (not signed in)   (lady role)    (supporter role)
                   │              │              │
        ┌──────────┼──┐     ┌────┴────┐    ┌────┴────┐
        ▼          ▼  ▼     ▼         ▼    ▼         ▼
     Landing   Onboard  Edu   Full      Edu  Emotion  Streaks
                   Settings access    only  Translator
```

```
                        ┌──────────────────────────────┐
                        │        PARTNER ROLES         │
                        └──────────────┬───────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
               LADY (Tracker)   PARTNER (Full)   PARTNER (Educational)
                    │                  │                  │
            ┌───────┴───────┐          │          ┌───────┴───────┐
            ▼   ▼   ▼   ▼   ▼          ▼          ▼   ▼   ▼   ▼   ▼
         Dash Tracker   Calendar   Full dash   Edu   Ask   Set
             Sympt  Sync    Ins    Tips Sync  only  only
                    Tips  Notes  Notif  Lock
```

---

## 🔒 Privacy Model

- **Partner access levels** — `full` (sensitive logs) vs `educational` (health articles only)
- **Passcode vault** — locked chats isolated into `mensflow_locked_chats`; AES-GCM before upload (planned)
- **Local-only toggle** — `privacyStrictLocalOnly` prevents any server uploads
- **Auth expiry** — 401 triggers `mf:auth:expired` → logout

---

## 🧮 Cycle Math

`frontend/src/lib/cycleUtils.ts` (frontend) and `backend/src/utils/cycleUtils.ts` (backend) share cycle-length-aware thresholds:

- **Period:** 4 days (≤24), 5 days (25–35), 6 days (≥36)
- **Ovulation:** `max(periodLen + 5, cycleLen - 14)`
- **Fertile:** ovulation −4 → ovulation +2
- **Luteal:** fertileEnd + 1 → cycleLen

| Phase | UI Color |
|-------|---------|
| Menstrual | `#f43f5e` rose |
| Follicular | `#0d9488` teal |
| Fertile | `#26899e` sky-blue |
| Luteal | `#d97706` amber |

---

## 🤝 Development

MensFlow uses Agile sprints with standard branch naming (`type/short-description`), Conventional Commits, and squash-merge PRs. For details: [`docs/collaboration_guide.md`](https://github.com/dadaxlabs/mensflow/blob/main/docs/collaboration_guide.md).
