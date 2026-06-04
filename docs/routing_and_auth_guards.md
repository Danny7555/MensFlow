# MensFlow Routing, Authentication, & Navigation Guards 🔐

[← Back to README](README.md) | [← Back to Docs](README.md#-table-of-contents)

MensFlow uses **React Router v7** with lazy-loaded views inside `App.tsx:25-40`. The router lives inside a `MainShell` component (`frontend/src/App.tsx:327`) and applies two guards:

- `!isAuthenticated` — block private routes for guests
- `ChatLockGate` — re-prompt passcode before unlocking locked-chats (`App.tsx:43`)
- `AccessGate` — enforce `full` vs `educational` partner access on sensitive views

---

## 🚦 Routing Table

All routes are defined between `App.tsx:424-475`. The router branches on `isAuthenticated` from `useAuth()`.

### Guest Routes (`!isAuthenticated`)

| Path | View | Notes |
|------|------|-------|
| `/` | `LandingView` | Public landing + auth CTA |
| `/onboarding` | `OnboardingView` | Role selection, cycle baseline |
| `/settings` | `SettingsView` (isGuest) | Guest mode — pass `onLogin` |
| `/education` | `EducationView` | Public health articles |
| `/locked-chats` | `LockedChatsView` | Self-gated (passcode inside) |
| `/ask`, `/dashboard`, `/calendar`, `/tracker`, `/insights`, `/tips`, `/symptoms`, `/sync`, `/notifications`, `/history` | `<Navigate to="/" replace />` | Redirects to landing |
| `*` | `NotFoundView` | 404 |

### Authenticated Routes

| Path | View | Guard | Partner redirect |
|------|------|-------|-----------------|
| `/` | → `/onboarding` or `/dashboard` or `/education` | — | `accessLevel==educational` → `/education` |
| `/onboarding` | `OnboardingView` | — | — |
| `/dashboard` | `DashboardView` | `AccessGate` | yes |
| `/ask` | `ChatView` | `ChatLockGate` (outer) | — |
| `/settings` | `SettingsView` | — | — |
| `/insights` | `InsightsView` | `AccessGate` | yes |
| `/calendar` | `CalendarView` | `AccessGate` | yes |
| `/tracker` | `TrackerView` | `AccessGate` | yes |
| `/symptoms` | `SymptomsView` | `AccessGate` | yes |
| `/sync` | `SyncView` | `AccessGate` | yes |
| `/notifications` | `NotificationsView` | `AccessGate` | yes |
| `/tips` | `TipsView` | `AccessGate` | yes |
| `/education` | `EducationView` | — | yes (all partners land here on `/`) |
| `/locked-chats` | `LockedChatsView` | — | yes |
| `/history`, `/health-insights`, `/wellness-tips` | `<>` redirect → `/insights`/`/tips` | — | — |
| `*` | `NotFoundView` | — | — |

---

## 🔑 `AuthProvider` (`frontend/src/context/AuthProvider.tsx`)

Global auth state. Any view that calls `useAuth()` gets:

- `isAuthenticated: boolean`
- `onboardingCompleted: boolean`
- `openAuthModal: () => void`
- `login: (payload) => void`
- `logout: () => void`
- `isRehydrating: boolean` — set while Zustand rehydrates from localStorage

The provider wraps the entire app in `App.tsx:580-588`.

---

## 🔒 Chat Lock Gate (`frontend/src/App.tsx:43`)

`ChatLockGate` is a JSX guard wrapping `/ask` when `privacyLockChats` is enabled in settings. It manages:

- 3-state mode: `unlock` → `reset-security` → `reset-password`
- Failed-attempt counter: 3 wrong passwords → "Forgot Password?" button
- Security question answer check against `settings.privacyLockChatsSecurityAnswer`
- Password strength enforcement via `lib/passwordStrength.ts`

---

## 🛡️ Access Gate (`frontend/src/components/AccessGate.tsx`)

Wraps `dashboard`, `insights`, `calendar`, `tracker`, `symptoms`, `sync`, `notifications`, `tips` for authenticated users. When `user.accessLevel === 'educational'`, most of these views redirect to `/education`.
