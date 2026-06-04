# MensFlow — Project Overview

[← Back to README](README.md)

MensFlow is a menstrual health and partner-support app built with React and an Express backend backed by MongoDB. This note explains how the system is put together, how data moves, who can see what, and the key ideas behind the privacy model.

---

## Why it exists

MensFlow is built for two people at once: the person tracking their cycle, and the person who wants to support them better.

For the tracker, it replaces scattered notes and guesswork with a single place to log symptoms, see cycle patterns, and understand what their body is doing.

For the partner, it translates biological changes into plain, actionable care — so support feels informed instead of accidental.

The app also targets Ghanaian adolescent health education, with a dedicated educational access level that surfaces only health articles and removes everything else.

---

## How it’s built

The system has three parts:

```
 Frontend (your phone or browser)
     ↕ HTTPS
 Backend (Express API)
     ↕ Mongoose
 Database (MongoDB)
```

**Frontend** — React 19 with TypeScript, served by Vite. It handles the views, animations, calendar, charts, chat, and all user interactions.

**Backend** — Express with TypeScript. It handles login, saves logs, sends partner invites, serves education content, and runs a small scheduler.

**Database** — MongoDB, accessed through Mongoose. It stores user accounts, cycle profiles, symptom logs, partner connections, chat history, and app settings.

The frontend runs at `localhost:5173` in development. The backend runs at `localhost:5001`. Both are deployed on Vercel in production.

---

## How information flows

The app is in a hybrid state right now: it still keeps some things locally, but it is moving toward full backend sync.

When you tap to log a symptom or update a setting:

1. The UI updates immediately so the app feels fast.
2. The change is sent to the backend if you’re signed in and not in local-only mode.
3. If the request succeeds, the server’s version becomes the truth.
4. If the request fails, the app rolls back and shows a quiet error — nothing is silently lost.
5. Settings like theme choice and sidebar preference stay on the device only, because they don’t need to sync.

Partner status pings are the one exception. Right now they travel between browser tabs using a shared localStorage key. This works on one machine. Cross-device real-time sync through WebSockets is the next step.

---

## Who can do what

MensFlow has three lanes: Guest, Tracker (Lady), and Partner.

**Guest** — anyone who hasn’t signed in yet. They can browse the landing page, run onboarding, read education content, and change guest-only settings. Everything else redirects to the home page.

**Tracker (Lady role)** — the main user. Full access to dashboard, calendar, symptom logging, insights, tips, settings, sync, and locked chats.

**Partner** — a supporter who has been invited by a tracker. Partners fall into two access levels:

| Level | What they see |
|-------|---------------|
| **Full** | Dashboard, tracker, calendar, sync, insights, tips, notifications, and locked chats |
| **Educational** | Education content only. All other routes redirect back to `/education` |

This split exists so programs like the Ghanaian adolescent health initiative can deploy partners who see only curated health articles without exposing sensitive logs.

---

## Privacy by design

MensFlow treats health data as sensitive by default.

- **Access levels** — a tracker’s detailed logs are never visible to an educational-level partner.
- **Passcode vault** — locked chats are stored separately from regular chats. A wrong passcode three times in a row triggers a security-question recovery instead of a permanent lockout.
- **Local-only mode** — a privacy toggle in settings can stop all uploads. When on, data stays on the device.
- **Token expiry** — when a login session expires, the app logs the user out cleanly and redirects them home.

---

## Folder layout

```
 MensFlow/
 ├── README.md
 ├── docs/                     ← detailed notes on routing, design, cycle math, and API work
 ├── backend/
 │    └── src/
 │        ├── config/          ← database, mailer, rate limiting, environment
 │        ├── controllers/     ← auth, cycle, chat, partner, user, tips, education
 │        ├── middleware/      ← JWT checks and error handling
 │        ├── models/          ← database shapes for users, logs, partners, chats, etc.
 │        ├── routes/          ← URL endpoints the frontend talks to
 │        ├── services/        ← business logic for auth, cycles, email, partner, scheduler
 │        └── index.ts         ← server start and CORS setup
 └── frontend/
      └── src/
          ├── views/           ← the 15 main screens
          ├── components/      ← reusable pieces for dashboards, trackers, and UI
          ├── context/         ← auth, chat session, and settings providers
          ├── services/        ← API clients for logs, partner, chat, tips, education
          ├── store/useStore.ts ← global state for logs, dashboard, settings, and streaks
          ├── lib/             ← helpers for cycle math, theming, and API requests
          ├── hooks/           ← push notifications and screen-size helpers
          └── data/            ← symptom lists, tips, education articles, and onboarding seeds
```

---

## Cycle logic in plain terms

The app figures out which phase of the menstrual cycle you’re in by counting days from your last period start.

- Short cycles (24 days or fewer) get a shorter assumed period window.
- Longer cycles (36 days or more) get a longer one.
- Ovulation is roughly fourteen days before the cycle ends.
- The fertile window opens a few days before ovulation and closes a couple of days after.
- Everything after that until the cycle ends is the luteal phase.
- The days before the fertile window are the follicular phase.

Each phase shifts the app’s colors, tips, and empathy translations so the experience feels aligned with what’s actually happening biologically.

---

## Where things are heading

The main focus right now is finishing the backend migration. Features like full WebSocket partner sync, client-side chat encryption, and deeper TanStack Query adoption are already planned or partially in progress.

For day-to-day workflow — branching, commits, reviews, and quality checks — see [`docs/collaboration_guide.md`](https://github.com/dadaxlabs/mensflow/blob/main/docs/collaboration_guide.md).
