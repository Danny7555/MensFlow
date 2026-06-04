# MensFlow Cycle Calculations, State Management & Sync 🌸

[← Back to README](README.md) | [← Back to Overview](project_overview.md)

This document is the technical deep-dive into three systems: **cycle-phase math**, **global Zustand state**, and **partner cross-tab synchronization**. Use it when modifying symptom logic, adding log fields, or reworking the sync layer.

---

## 🧮 Cycle Calculation Engine

`frontend/src/lib/cycleUtils.ts` is the authoritative frontend cycle math; a backend equivalent lives at `backend/src/utils/cycleUtils.ts` for server-side validation.

### Cycle Day Calculation

```typescript
export function computeCycleDay(startIso: string, cycleLen: number): number {
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen || 28)))
  const start = new Date(`${startIso}T12:00:00`)  // noon avoids tz edge cases
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % safeCycleLen) + safeCycleLen) % safeCycleLen
  return m + 1  // 1-indexed for biological convention
}
```

Key guarantees:
- Clamped length: 15–60 days, default 28
- Noon `T12:00:00` prevents midnight timezone rollover bugs
- Negative or overflow cycles handled by double modulo

### Phase Detection (Cycle-Length-Aware)

```typescript
export function getPhaseFromDay(cycleDay: number, cycleLen = 28): CyclePhase {
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen || 28)))
  const periodLength = safeCycleLen <= 24 ? 4 : safeCycleLen >= 36 ? 6 : 5
  const ovulationDay = Math.max(periodLength + 5, safeCycleLen - 14)
  const fertileStart = Math.max(periodLength + 1, ovulationDay - 4)
  const fertileEnd   = Math.min(safeCycleLen, ovulationDay + 2)
  const lutealStart  = fertileEnd + 1

  if (cycleDay <= periodLength) return 'menstrual'
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
  if (cycleDay >= lutealStart) return 'luteal'
  return 'follicular'
}
```

```
 PHASE THRESHOLDS (visual)
 ┌─────────────────────────────────────────────────────────┐
 │                        Cycle (day 1 → cycleLen)          │
 │  menstrual     fertile            luteal                 │
 │  ░░░░░░        ░░░░░░░░░░          ░░░░░░░░░░           │
 │  ▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓▓         ▓▓▓▓▓▓▓▓▓▓▓          │
 │  4-6 days      4-6 days           remaining days        │
 │           ░░░░░░░░░░░                                    │
 │           follicular (the rest)                          │
 └─────────────────────────────────────────────────────────┘

 Thresholds vary by total cycle length:
   ≤24 days  → period = 4 days
   25-35     → period = 5 days
   ≥36       → period = 6 days
   Ovulation ≈ cycleLen - 14
   Fertile window = ovulation - 4 … ovulation + 2
   Luteal = fertileEnd + 1 … end of cycle
```

### Phase Metadata

| Phase | Color | UI vibe | Partner guidance |
|-------|-------|---------|------------------|
| `menstrual` | `#f43f5e` rose | Warm red | "Prepare heating pad, handle chores" |
| `follicular` | `#0d9488` teal | Upbeat teal | "Plan outdoor activity, encourage social time" |
| `fertile` | `#26899e` sky-blue | High energy | "Schedule date night, leave post-it" |
| `luteal` | `#d97706` amber | Slowing amber | "Pick up comfort snack, avoid big talks" |

---

## 📦 Global State Management (Zustand)

All inputs, preferences, symptom logs, and partnership stats are centralized in `frontend/src/store/useStore.ts`.

### Persistence Strategy

```
 STATE PERSISTENCE DECISION TREE
                   persisted in Zustand 'persist'
                   (localStorage key: mensflow-storage)
                              │
            ┌─────────────────┴──────────────────┐
            ▼                                    ▼
     settings.*                        logs, dashboard
     sidebarCollapsed                  supportStreak,
     themeMode                         completedActions
     user.name                          ← remote owned
     customSymptoms
     privacyLock*
     ← always local
     ↑

     On login: local logs can be pushed to backend
     On logout: remote data cleared; local prefs stay
```

Three modes in practice:

| Is Authenticated | `privacyStrictLocalOnly` | Where data lives |
|-----------------|--------------------------|-----------------|
| No (guest) | any | memory + localStorage |
| Yes | `false` | optimistic local + backend sync via `logsApi.upsert()` |
| Yes | `true` | memory + localStorage only (no server contact) |

### Log Entry Shape

```typescript
export type SymptomLog = {
  date: string             // YYYY-MM-DD
  symptoms: string[]       // kebab-case symptom IDs
  water?: number           // ml (default 1000)
  weight?: number          // kg (default 62.5)
  lhLevel?: string | null  // fertility indicator
  mucus?: string | null    // cervical mucus observation
}
```

Merge rules:
1. Existing log on same date → update fields, not replace
2. Unmentioned fields → keep previous value
3. Numeric defaults → 1000ml water, 62.5kg weight

### Symptom Categories

`frontend/src/data/symptomsData.ts`:

| Category | Examples |
|----------|---------|
| Flow | `flow-light`, `flow-medium`, `flow-heavy` |
| Mood | `mood-calm`, `mood-happy`, `mood-anxious`, `mood-sad`, `mood-irritable` |
| Physical | cramps, headache, bloating, fatigue, breast tenderness, acne |
| Lifestyle | sleep quality, BBT, sexual activity, pill taken |
| Other | PCOS, endometriosis, perimenopause |

---

## 🤝 Partner Sync (Cross-Tab)

The app uses a **localStorage event bridge** to communicate between SyncView and DashboardView within the same browser:

```
 CROSS-TAB PARTNER PING FLOW
 ┌────────────────────────────────────────────────────────────────────┐
 │                                                                    │
 │  Partner sends          Tracker receives                           │
 │  status ping            (open tab / window)                        │
 │       │                    │                                       │
 │       ▼                    ▼                                       │
 │  SyncView.tsx         DashboardView.tsx                            │
 │       │                    │                                       │
 │  localStorage         window.addEventListener('storage', ...)      │
 │  .setItem(                               │                       │
 │    'mensflow_                              │                       │
 │     partner_                               ▼                       │
 │     ping:v1',                             │                       │
 │     JSON(                                 │                       │
 │       pingData                            │                       │
 │     )                                     │                       │
 │  )                    compares timestamp                            │
 │       │                 against last seen                           │
 │       ▼                    │                                       │
 │  dispatch             prevents                                    │
 │  'storage'            duplicates                                   │
 │  event                                            ▼              │
 │                                            sonner toast            │
 │                                            "Partner update"       │
 │                                                                    │
 └────────────────────────────────────────────────────────────────────┘
```

**Sender (`SyncView.tsx`):**
```typescript
localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
window.dispatchEvent(new Event('storage'))  // force same-window listeners
```

**Receiver (`DashboardView.tsx`):**
```typescript
window.addEventListener('storage', handlePingEvent)
```

This is a same-browser workaround. Cross-device real-time sync via **WebSocket or SSE** is the planned upgrade (see `docs/api_integration_blueprint.md`).

### Support Actions & Streaks

The partnership tool lives in Zustand state:

| Key | Meaning |
|-----|---------|
| `completedActions: string[]` | IDs of gestures finished today |
| `supportStreak: number` | consecutive days with ≥1 action |
| `lastActionDate: string (ISO)` | calendar day of the last streak |

`checkAndResetDailyActions()` runs on app open; if `lastActionDate` is yesterday or older, the streak resets to zero. Partner support suggestions are generated per-phase via `getPhaseTasks(phase)` in `cycleUtils.ts`.

---

## 🔒 Locked Chats Security State

Messages for `ChatView` and `LockedChatsView` are **not mixed**. The app creates isolation through a separate localStorage key:

```
 CHAT STATE ISOLATION
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │   mensflow-storage (Zustand persist)                     │
 │        │                                                │
 │        ▼                                                │
 │   [standard chat messages — in-memory only or backend]  │
 │                                                         │
 │                                                         │
 │   mensflow_locked_chats (separate localStorage key)      │
 │        │                                                │
 │        ▼                                                │
 │   [encrypted array — passcode required to read/write]   │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

### Current Behavior (no encryption at rest)

- `privacyLockChats === false`: chat messages stored normally in session state
- `privacyLockChats === true`: messages read from + written to `mensflow_locked_chats`
- Re-entry without passcode → password input shown again

### Planned Behavior (`feature/add-lock-chat`)

1. User provides passcode in `LockedChatsView.tsx`
2. App derives AES-GCM key via `crypto.subtle` from passcode
3. All messages are encrypted client-side
4. POST `/api/chats/locked` stores **ciphertext only**
5. Decryption occurs in memory — plaintext never touches disk
6. Backend cannot read message contents

### Lockout Flow

```
 LOCKOUT RECOVERY STATE MACHINE
              failedAttempts >= 3
                        │
                        ▼
               Show "Forgot Password?"
                        │
             User taps button
                        │
                        ▼
             reset-security mode
                        │
           Answer security question
                        │
              ┌─────┴─────┐
              ▼           ▼
           Correct     Incorrect
              │           │
              ▼           ▼
         reset-      try again
        password
              │
         Enter new pass
         (strength check)
              │
         isStrong?        ──►  show strength hint
              │
             YES
              │
         Save to settings
              │
              ▼
         isUnlocked = true
```
