# MensFlow Routing, Authentication, & Navigation Guards 🔐

[← Back to README](README.md) | [← Back to Overview](project_overview.md)

This document explains the router layout, authentication states, and private navigation guards implemented in MensFlow. Understanding this structure is essential for adding new views or modifying navigation links.

---

## 📖 Table of Contents

1. [System Overview](#system-overview)
2. [Route Architecture](#route-architecture)
3. [Authentication Journeys](#authentication-journeys)
4. [Route Guard Reference](#route-guard-reference)
5. [AuthProvider API](#authprovider-api)
6. [Partner Access Levels](#partner-access-levels)

---

## 🏗️ System Overview

```
 MENFLOW ROUTING ARCHITECTURE
 ┌──────────────────────────────────────────────────────────────────┐
 │                         App.tsx Router                           │
 │                                                                  │
 │  isRehydrating?  ──▶  PageLoader                                 │
 │       │                                                          │
 │       ▼                                                          │
 │  isAuthenticated?                                                │
 │       │                                                          │
 │    ┌──┴──┐                                                       │
 │    ▼     ▼                                                        │
 │  Guest   Logged-In                                                │
 │    │      │                                                        │
 │    │  onboardingDone?                                             │
 │    │      │                                                        │
 │    │   ┌──┴──┐                                                    │
 │    │   ▼     ▼                                                    │
 │    │  No     Yes                                                  │
 │    │   │      │                                                    │
 │    │   ▼      └──▶ user.accessLevel?                              │
 │    │ Onboard       │                                              │
 │    │   │       ┌──┴──┐                                           │
 │    │   │       ▼     ▼                                           │
 │    │   │     Edu   Full                                          │
 │    │   │       │      │                                           │
 │    │   │       ▼      ▼                                           │
 │    │   │    Edu     Dashboard                                     │
 │    │   │   views    + full views                                  │
 │    │   │                                                        │
 │    └───┼──────────────────────────────────────────────────────┘
 │        ▼                                                          │
 │  AccessGate wraps dashboard / tracker / calendar / symptoms      │
 │  ChatLockGate wraps /ask when privacy lock is ON                  │
 └──────────────────────────────────────────────────────────────────┘
```

**Three distinct routing trees exist:**

- **Guest:** public landing, onboarding, guest settings, education
- **Authenticated (Lady):** full dashboard + tracker + calendar + symptoms + sync + notifications + insights + tips + locked chats
- **Authenticated (Partner):**
  - `educational` access level → education only
  - `full` access level → full dashboard + emotion translator + support streaks

---

## 🗺️ Route Map (All 15 Routes)

Routes are defined in `frontend/src/App.tsx` between lines 424–475, all lazy-loaded via `React.lazy()` plus `Suspense` + `AnimatePresence`. Guard components surround sensitive routes.

| Route | Path | Component | Auth | Guard | Description |
|-------|------|-----------|------|-------|-------------|
| Landing | `/` | `LandingView` | ❌ None | — | Public app intro + auth buttons |
| Onboarding | `/onboarding` | `OnboardingView` | ✅ Both | — | Role selection + cycle baseline |
| Dashboard | `/dashboard` | `DashboardView` | ✅ Logged-in | `AccessGate` | Home feed + Today's Plan |
| Tracker | `/tracker` | `TrackerView` | ✅ Logged-in | `AccessGate` | Cycle wheel + metrics |
| Calendar | `/calendar` | `CalendarView` | ✅ Logged-in | `AccessGate` | Phase indicators + day picker |
| Symptoms | `/symptoms` | `SymptomsView` | ✅ Logged-in | `AccessGate` | Log modal + trend charts |
| Ask AI | `/ask` | `ChatView` | ✅ Logged-in | `ChatLockGate` | AI companion chat |
| Locked Chats | `/locked-chats` | `LockedChatsView` | ✅ Logged-in | Passcode | Privacy vault |
| Sync | `/sync` | `SyncView` | ✅ Logged-in | `AccessGate` | Partner pings + streaks |
| Insights | `/insights` | `InsightsView` | ✅ Logged-in | `AccessGate` | Charts + CSV/PDF export |
| Tips | `/tips` | `TipsView` | ✅ Logged-in | `AccessGate` | Phase-specific tips |
| Education | `/education` | `EducationView` | ❌ Guest | — | Health articles |
| Settings | `/settings` | `SettingsView` | ✅ Both | — | Cycle + privacy + layout |
| Notifications | `/notifications` | `NotificationsView` | ✅ Logged-in | `AccessGate` | Partner pings + alerts |
| Tracker | `/tracker` | `TrackerView` | ✅ Logged-in | `AccessGate` | Health metrics + logs |
| Not Found | `*` | `NotFoundView` | ❌ — | — | 404 fallback |

Redirect routes (`/history`, `/health-insights`, `/wellness-tips`) point to `/insights` or `/tips` to keep the URL tree tidy.

---

## 🔐 Authentication Journeys

```
 GUEST AUTHENTICATION FLOW
 ┌────────────────────────────────────────────────────────────────┐
 │                                                                │
 │  1. User opens app at /                                        │
 │     → isAuthenticated = false                                  │
 │     → isRehydrating = true                                     │
 │     ~> PageLoader shown                                        │
 │                                                                │
 │  2. Rehydration done                                           │
 │     → Navigate based on onboardingCompleted                    │
 │                                                                │
 │     ┌─── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐            │
 │     ▼                                            ▼            │
 │   Not onboarded          Already onboarded                     │
 │     │                        │                                 │
 │     ▼                        ▼                                 │
 │  /onboarding          Switch to dashboard                       │
 │  OR guest             (or /education if partner)               │
 │  settings                                                      │
 │                                                                │
 │  3. User clicks "Sign In"                                      │
 │     → openAuthModal() launched from any button                 │
 │     → Modal: Login (email + password)                          │
 │         OR Register (UTT, email, otp flow)                     │
 │                                                                │
 │  4. POST /api/auth/login                                       │
 │     200 OK → { token, user }                                   │
 │     → isAuthenticated = true                                   │
 │     → login() stores user object                               │
 │     → navigate to dashboard or education                       │
 │                                                                │
 └────────────────────────────────────────────────────────────────┘

 AUTH GUARDS
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
 │     Guest      │     │   Lady/User   │     │     Partner   │
 ├───────────────┤     ├───────────────┤     ├───────────────┤
 │ Landing        │     │ Dashboard     │     │ Educational   │
 │ Onboarding     │     │ Tracker       │     │  (Edu only)   │
 │ Guest Settings │     │ Calendar      │     │ Ask           │
 │ Education      │     │ Symptoms      │     │ Settings      │
 │ Locked Chats*  │     │ Sync          │     │               │
 │               │     │ Insights      │     │               │
 │  *self-gated  │     │ Tips          │     │               │
 │               │     │ Notifications │     │               │
 │               │     │ Settings      │     │               │
 └───────────────┘     │ Locked Chats  │     └───────────────┘
                       └───────────────┘

   PARTNER REDIRECT TREE
                 user.accessLevel === 'educational'
                               │
                     ┌────────┴────────┐
                     ▼                 ▼
                  /education         — (other routes)
                 (allowed)          redirected to /education


   CHAT LOCK GATE STATE MACHINE
                         privacyLockChats enabled?
                                  │
                         ┌──────┴──────┐
                         ▼             ▼
                       YES            NO
                        │              │
                  ┌─────┴────┐    Show ChatView
                  ▼           ▼      normally
              Locked    Unlocked
                │          │
        attempts < 3      isUnlocked = true
                │          │
          show passcode   Show chat content
          input form      + "Lock Now" button
                │
         attempts >= 3
                │
         show "Forgot Password?"
                │
          answer security Q
                │
          correct?       incorrect
            │                │
           YES              NO
            │                │
     reset-password      try again
       mode
```

---

## 🧩 Guard Reference

### `!isAuthenticated` — Guest Block

When `isAuthenticated === false`, all private routes redirect to `LandingView` via React Router `<Navigate>`:

```
/ask  →  /
/dashboard  →  /
/calendar  →  /
/tracker  →  /
/insights  →  /
/tips  →  /
/symptoms  →  /
/sync  →  /
/notifications  →  /
/history  →  /
```

Only four routes remain reachable:

- `/` — `LandingView` (public preview)
- `/onboarding` — `OnboardingView` (setup flow)
- `/settings` — `SettingsView` (guest mode, lock button calls `openAuthModal`)
- `/education` — `EducationView` (open health articles)
- `/locked-chats` — `LockedChatsView` (self-contained gate)

### `ChatLockGate` (`App.tsx:43`)

A local state machine wrapping `/ask` only when `settings.privacyLockChats === true`. Manages three modes:

- `unlock` — passcode input against `settings.privacyLockChatsPassword`
- `reset-security` — answer configured security question
- `reset-password` — set a new password (strength meter enforced)

After 3 wrong passwords, the "Forgot Password?" button appears and sends the user to `reset-security` mode. Correct answer advances to `reset-password`. If the new password passes `passwordStrength.ts` checks (`isStrong === true`), it is written to settings and the chat unlocks.

### `AccessGate` (`frontend/src/components/AccessGate.tsx`)

Wraps these views: `/dashboard`, `/tracker`, `/calendar`, `/symptoms`, `/sync`, `/notifications`, `/insights`, `/tips`. If `user.accessLevel !== 'full'`, redirects to `/education`. Used for teen/educational deployments where detailed logs should be hidden.

---

## 🔑 `AuthProvider` (`frontend/src/context/AuthProvider.tsx`)

Wraps the entire app in `App.tsx:580-588` as the outermost provider chain:

```
 <AuthProvider>
   <ThemeSync />
   <MainShell />
   <DynamicToaster />
   <GlobalModalContainer />
 </AuthProvider>
```

### `useAuth()` Return Type

```typescript
interface AuthContextValue {
  isAuthenticated: boolean   // session exists
  onboardingCompleted: boolean  // cycle baseline set
  isRehydrating: boolean    // Zustand persist rehydrating
  openAuthModal: () => void // show credentials overlay
  login: (payload) => void  // register + start session
  logout: () => void        // clear token, reset state, redirect
}
```

The rehydration process:

```
App Mount
 └─▶ Zustand persist reads localStorage under 'mensflow-storage'
     └─▶ isRehydrating = true → <PageLoader /> shown
         └─▶ rehydrate completes
             └─▶ isRehydrating = false → router renders real routes
```

---

## 🤝 Partner Access Levels

Two boolean fields shape what a partner can see:

```
 ACCESS LEVEL DECISION TREE
        user.role === 'partner'?
               │
        ┌──────┴────────────┐
        NO                  YES
         │                  │
    role = 'lady'    Is paired?
    (tracker)             │
         │          ┌──────┴────────────┐
    full access       NO                  YES
    all views         │                  │
                     ▼                  ▼
                no partner         accessLevel
                 linked              set via
                 shows            /partner/pair
               partner-only
               onboarding
```

Three access levels in practice:

| Level | Who sees it | What is visible |
|-------|-------------|-----------------|
| `full` | Lady + paired Partner | Dashboard, tracker, calendar, symptoms, sync, notifications, insights, tips, locked chats |
| `educational` | Partner in school program | `/education` content only; other routes redirect |
| `guest` | Not signed in | Landing, onboarding, guest settings, education |
