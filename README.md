# MensFlow 🌸

**MensFlow** is a dual-audience menstrual health and relationship support platform. It connects menstruating individuals ("trackers") and their partners in a private ecosystem that tracks cycles, logs symptoms, and translates biological changes into empathetic, actionable partner support guidelines.

> **Status:** Frontend (React 19 · Vite) is in active development with a live backend (Express + MongoDB + Mongoose). The frontend is transitioning from localStorage-only to full backend integration (see `feature/integrate-backend` and `feature/migrate-tanstack-query`).

---

## ✨ Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Cycle Tracking** | Cycle wheel, phase prediction, calendar with period/follicular/fertile/luteal indicators |
| 2 | **Symptom Logging** | Flow, mood, physical, lifestyle, custom symptoms with trend charts |
| 3 | **AI Companion** | Chat with `Ask MensFlow` for hormone, diet, and wellness Q&A |
| 4 | **Locked Chats** | Passcode-protected chat vault with security question recovery |
| 5 | **Partner Sync** | Status pings, emotion translator, support action checklist with streaks |
| 6 | **Insights & Reports** | Phase-specific trends, CSV/PDF export, partner privacy mode |
| 7 | **Education** | Health articles (with "educational" access level for Ghanaian adolescent health) |
| 8 | **Wellness Tips** | Phase-specific daily tips and partner support suggestions |
| 9 | **Dark / Light Theme** | Organic warm-plum design system with CSS custom properties |
| 10 | **Push Notifications** | Browser push notifications aligned to real cycle data |

---

## 👩‍⚕️ For the Tracker — 🤝 For the Partner

**Tracker:** Log flow intensity (light / medium / heavy), moods, physical symptoms, sleep, BBT, LH levels, and cervical mucus. View cycle predictions, hormone trends, and wellness scores.

**Partner:** Receive real-time status pings (e.g., "Crampy", "Exhausted"). Get automatic phase-specific empathy translations (e.g., "Luteal Phase — Progesterone is peaking. Keep the room cool and offer a magnesium-rich snack"). Complete support actions to build daily connection streaks.

---

## 🌸 What Makes MensFlow Unique

1. **Relationship-first design** — not just a solo tracker; it actively educates and equips partners
2. **Native iOS aesthetics** — frosted glass navigation, tactile squish buttons, ambient phase-shifting backgrounds
3. **Zero clutter, no paywalls** — distraction-free interface with warm plum / dark-mode color system
4. **Privacy-centric** — passcode-locked chat vaults, local-only storage toggle, strict data controls

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 · TypeScript · Vite · React Router v7 |
| **State** | Zustand (localStorage persistence) · TanStack Query v5 |
| **Styling** | Tailwind CSS v4 · Custom CSS Design System |
| **Animations** | Framer Motion · tailwindcss-animate |
| **Charts** | Recharts 3 |
| **Backend** | Express · TypeScript · ts-node-dev |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT (jsonwebtoken) · bcrypt · OTP (email via Nodemailer) |
| **Scheduler** | node-cron |
| **Deploy** | Vercel (frontend + backend) |

---

## 📺 What Each View Does

| View | Path | What it does |
|------|------|--------------|
| **Landing** | `/` | Public page with app intro and auth options |
| **Onboarding** | `/onboarding` | Role selection (Lady / Partner), cycle baseline setup |
| **Dashboard** | `/dashboard` | Home feed with ambient phase colors, Stories, and Today's Plan cards |
| **Tracker** | `/tracker` | Cycle wheel, stats, history, health metrics (water/weight/LH/mucus), cycle tips |
| **Calendar** | `/calendar` | Custom grid with period / fertile / follicular indicators; tap a day for symptom details |
| **Symptoms** | `/symptoms` | Log flow, mood, physical, lifestyle, and custom symptoms; view trend charts |
| **Ask AI** | `/ask` | Chat with the MensFlow companion; temporary sandbox mode for guests |
| **Locked Chats** | `/locked-chats` | Passcode-protected chat vault; 3-attempt limit triggers security-question recovery |
| **Sync** | `/sync` | Send partner pings, use the emotion translator, log support actions and streaks |
| **Insights** | `/insights` | Trend summaries, interactive charts, CSV/PDF export, partner privacy mode |
| **Tips** | `/tips` | Phase-specific wellness tips and partner support suggestions |
| **Education** | `/education` | Health articles (accessible to `educational` access-level users) |
| **Settings** | `/settings` | Cycle customization, privacy/security, theme (light/dark/system), sidebar/mobile layout |
| **Notifications** | `/notifications` | Partner pings, access requests, system alerts |
| **Not Found** | `*` | 404 fallback |

---

## 📂 Directory Layout

```
MensFlow/
├── README.md                          ← you are here
├── docs/                              ← architecture & workflow docs
│   ├── project_overview.md
│   ├── routing_and_auth_guards.md
│   ├── api_integration_blueprint.md
│   ├── cycle_and_state_architecture.md
│   ├── mock_api_sandbox.md
│   ├── theme_and_design_system.md
│   └── collaboration_guide.md
│
├── backend/                           ← Express + MongoDB API
│   ├── src/
│   │   ├── config/                    # env, DB, mailer, rate limiter
│   │   ├── controllers/               # auth, cycle, chat, partner, user, tips, education
│   │   ├── middleware/                # JWT auth, rate limiting, error handling
│   │   ├── models/                    # User, Chat, Partner, Log, Dashboard, Settings,
│   │   │                             # Symptom, EducationArticle, WellnessTip, LoginHistory
│   │   ├── routes/                    # auth, cycle, partner, scheduler, user, support,
│   │   │                             # education, wellnessTip
│   │   ├── services/                  # auth (OTP), cycle, chat, email, partner,
│   │   │                             # scheduler, user
│   │   ├── utils/                     # cycle model, HTTP helpers, validators, seeders
│   │   └── index.ts                   # server entry + CORS
│   ├── vercel.json                    # serverless + cron webhook
│   └── migrations/
│
└── frontend/                          ← React 19 + Vite SPA
    ├── src/
    │   ├── views/                     # 15 lazy-loaded page views
    │   ├── components/
    │   │   ├── dashboard/             # DailyCheckIn, FeedSection, EmotionTranslator,
    │   │   │                         # Stories, wellness / hormone / tip cards
    │   │   ├── tracker/               # CycleWheel, CycleStatsHero, HealthMetrics,
    │   │   │                         # CycleHistory, CycleLogs, CycleTips
    │   │   ├── skeletons/             # loading states for every major view
    │   │   └── ui/                    # Card, Button, Input, Modal, Select, Tooltip,
    │   │                             # Popover, Dialog, Calendar
    │   ├── context/                   # AuthProvider, ChatSessionContext, SettingsProvider
    │   ├── services/                  # auth, chat, logs, partner, user, tips, education
    │   ├── store/useStore.ts          # Zustand global state
    │   ├── lib/                       # apiClient, cycleUtils, theme, passwordStrength
    │   ├── hooks/                     # useMediaQuery, useSmartPushNotifications
    │   ├── data/                      # symptoms, tips, education, onboarding seeds
    │   ├── types/                     # TypeScript interfaces
    │   ├── App.tsx                    # router + ChatLockGate + AccessGate
    │   ├── App.css                    # .app-shell, .app-main layout
    │   ├── index.css                  # Tailwind base + CSS Design Tokens
    │   └── main.tsx                   # bootstrap
    └── package.json
```

---

## 🎨 Design System

Everything is built around warm, organic CSS custom properties — no cold clinical grays:

| Token | Light | Dark |
|-------|-------|------|
| `--mf-main-bg` | `#fffafc` warm cream | `#1a1318` deep plum |
| `--mf-sidebar-bg` | `#fff5f8` blush | `#1f161d` plum |
| `--mf-card` | `#ffffff` | `#1f161d` |
| `--mf-border` | `#f8ecf0` rose | `#2e202b` wine |
| `--mf-accent` | `#ff6b8b` rose | `#ff8da1` glowing peach |
| `--mf-text` | `#3d3a43` charcoal | `#c9c4d1` lavender |
| `--mf-text-strong` | `#0c0a10` plum | `#f4f2f8` crisp white |
| `--mf-muted` | `#8c828d` | `#807682` |

**Micro-interactions:**
- **`.active-squish`** → `scale(0.985)` on press, simulates iOS haptic
- **`.animate-page-entry`** → staggered fade-slide-up, `0.7s cubic-bezier(0.16, 1, 0.3, 1)`
- **`.ambient-glow`** → `blur(150px)` phase-colored backgrounds behind dashboard cards
- **`.flo-card`** → `border-radius: 24px`, soft shadow
- **`.flo-bottom-nav`** → `backdrop-filter: blur(24px) saturate(200%)` frosted glass

---

## ⚡ State Management & Data Flow

The store lives in `frontend/src/store/useStore.ts`. It uses Zustand with a `persist` middleware that saves to `localStorage` under `mensflow-storage`.

```
Component → Zustand Action
  ├── Optimistic UI update (immediate)
  ├── HTTP call via services/ (Bearer JWT, /api/* endpoints)
  │     ├── Success → merge server state
  │     └── 401 → emit mf:auth:expired → automatic logout
  └── Fallback: localStorage persist for UI preferences only
```

**Service layer** (`frontend/src/services/`):

| Service | Endpoints |
|---------|-----------|
| `authService.ts` | `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/resend-otp` |
| `logsService.ts` | `GET/POST /logs`, `GET /logs/custom`, `GET /logs/review` |
| `partnerService.ts` | `GET /partner/status`, `POST /partner/pair`, `POST /partner/invite`, `POST /partner/ping`, `GET /partner/chat`, `POST /partner/action` |
| `chatService.ts` | Chat CRUD |
| `tipsService.ts` | `GET /tips` |
| `educationService.ts` | `GET /education` |

### Auth & Access Levels

- **Guest** — Landing, Onboarding, Guest Settings, Education. Everything else redirects to `/` or shows a login prompt.
- **Authenticated** — Dashboard, Insights, Tips, Calendar, Tracker, Symptoms, Sync, Notifications, Locked Chats.
- **Token expiry** — 401 responses trigger `mf:auth:expired` → logout.
- **Partner roles** — `lady` (tracker) or `partner` (supporter). Partners have two access levels: `full` or `educational`.

### Partner Sync (Cross-Tab)

Right now, partner pings use **localStorage events** inside the same browser:

```
SyncView → localStorage.setItem('mensflow_partner_ping:v1', JSON)
         → DashboardView listens on the 'storage' event
         → sonner toast alert
```

Full cross-device WebSocket / SSE sync is the next step (see `docs/api_integration_blueprint.md`).

---

## 🔐 Privacy & Security

- **Partner access levels** — `full` vs `educational`. Educational users (e.g., Ghanaian adolescent health program) see only education content.
- **Passcode vault** — locked chats are stored in a separate localStorage key (`mensflow_locked_chats`). Client-side AES-GCM encryption before upload is planned.
- **Local-only toggle** — `privacyStrictLocalOnly` in settings never sends data to the server.
- **Auth expiry** — 401 responses auto-expire the session via `mf:auth:expired`.

---

## 🧮 Cycle Math

`frontend/src/lib/cycleUtils.ts` computes cycle phases with cycle-length-aware thresholds:

- **Period:** 4 days (≤24), 5 days (25–35), 6 days (≥36)
- **Ovulation:** `max(periodLen + 5, cycleLen - 14)` days
- **Fertile window:** ovulation −4 → ovulation +2
- **Luteal:** fertileEnd + 1 → cycleLen

| Phase | Color |
|-------|-------|
| Menstrual | `#f43f5e` rose |
| Follicular | `#0d9488` teal |
| Fertile | `#26899e` sky-blue |
| Luteal | `#d97706` amber |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥18 and npm ≥9 (or `bun`)
- MongoDB (local or Atlas URI)
- For email features: Gmail app-password or SMTP provider

### Clone

```bash
git clone <repo-url>
cd MensFlow
```

### Frontend

```bash
cd frontend && npm install
npm run dev       # → http://localhost:5173/
```

### Backend

```bash
cd backend && npm install
```

Create `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/mensflow  # or Atlas
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev       # → http://localhost:5001/
```

### Run both

```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && npm run dev
```

---

## 🧪 Quality Checks

Run before every PR:

```bash
npm run typecheck   # strict TypeScript (no emit)
npm run lint        # ESLint
npm run doctor      # React best-practices scan
npm run build       # production build
```

---

## 🛠️ Adding a New Feature

Example: adding a "Hydration Tracker" view.

1. **State (optional)** — extend `AppState` in `frontend/src/store/useStore.ts`
2. **View** — create `frontend/src/views/HydrationView.tsx`; use `.flo-card`, `.active-squish`, `animate-in fade-in slide-in-from-bottom-4 duration-700`
3. **Route** — lazy-import it in `App.tsx` and add `<Route path="/hydration" element={<HydrationView />} />`
4. **Nav** — link it in `Sidebar.tsx` and/or the bottom mobile nav using Phosphor icons
5. **Styles** — use CSS custom properties (`var(--mf-accent)`, `var(--mf-card)`) — never raw hex values

---

## 🌿 Branching & PRs

- **Branches:** `type/short-description` in kebab-case
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- **PRs:** squash-merge, at least one review, lint + typecheck + build must pass
- **Main:** protected; every merge triggers a production deploy

For details: [`docs/collaboration_guide.md`](docs/collaboration_guide.md).
