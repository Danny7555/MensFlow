# MensFlow 🌸

Welcome to **MensFlow**, a premium, beautifully designed health application tailored specifically for tracking menstrual cycles, symptom correlations, and providing holistic wellness insights. Originally conceived to help users and their partners track, understand, and support menstrual wellness, MensFlow delivers an ultra-smooth, native-feeling iOS application experience inside a modern web environment.

> [!NOTE]
> This application follows state-of-the-art UX principles featuring tactile micro-interactions, organic glassmorphism layers, fluid page-entry animations, and custom dark mode themes that leverage **Tailwind CSS v4** alongside a unified bespoke CSS Design System.

---

## 📖 Table of Contents
*   [Project Overview & Mission Guide](file:///Users/david/Downloads/MensFlow/docs/project_overview.md) ( Ghanaian adolescent health context, MongoDB backend blueprint, and AI Engines )
1. [Core Features](#-core-features)
2. [MensFlow vs. Flo: What Makes It Unique?](#-mensflow-vs-flo-what-makes-it-unique)
3. [Tech Stack & Architecture](#-tech-stack--architecture)
4. [Detailed View & Page Documentation](#-detailed-view--page-documentation)
5. [Directory Layout](#-directory-layout)
6. [Bespoke Design System](#%EF%B8%8F-bespoke-design-system)
   - [CSS Custom Properties](#css-custom-properties)
   - [Glassmorphism & Backdrop Blurs](#glassmorphism--backdrop-blurs)
   - [Animations & Page Transitions](#animations--page-transitions)
   - [Micro-interactions & Tactile Squish](#micro-interactions--tactile-squish)
7. [State Management & Contexts](#-state-management--contexts)
   - [Zustand Global Store](#zustand-global-store)
   - [React Providers & Contexts](#react-providers--contexts)
8. [Getting Started (Developer Guide)](#-getting-started-developer-guide)
9. [Adding New Features (Developer Walkthrough)](#-adding-new-features-developer-walkthrough)
10. [Collaboration & Git Workflow](#-collaboration--git-workflow)

---

## ✨ Core Features

*   **Daily Symptom Logging:** Intuitive physical, mood, and flow symptom trackers with high-quality visual states. Supports custom symptom creation.
*   **Analytical Cycle Graphs:** Custom data visualizations powered by `Recharts` showcasing 6-month cycle variations and long-term symptom correlations.
*   **Personalized Insights & Wellness Tips:** Daily science-backed advice tailored to the active cycle phase (Menstrual, Follicular, Ovulatory, or Luteal).
*   **Interactive Calendar & Phase Predictor:** An elegant calendar grid detailing flow predictions, phase splits, and cycle histories.
*   **Interactive AI-like Support:** Premium, seamless chat companion (`ChatView`) facilitating private questions regarding hormone trends, mood swings, and wellness routines.
*   **Partner Sync & Empathy Hub:** Dual-user integration enabling partners to receive instant care instructions and check-ins.
*   **Premium iOS-style Aesthetics:** Organic corner curves (`rounded-3xl` equivalent), frosted-glass mobile tabs, fluid fade-and-slide motion profiles, and a warm dark-plum color system.

---

## 🌸 MensFlow vs. Flo: What Makes It Unique?

While commercial applications like Flo are excellent for personal tracking, MensFlow offers a distinct experience built around communication, zero visual clutter, and relationship support:

### 1. 🤝 Dual-Audience & Relationship-First Design
*   **Flo:** Primarily a solo logging tool. Its sharing features focus on exporting data sheets or raw tracking calendars.
*   **MensFlow:** Formulated as a collaborative hub. It recognizes that a cycle is highly relevant to partners and empowers them to offer proactive support.

### 2. 🔮 Core "Partner Translation" Engine
MensFlow automatically translates complex biological fluctuations into helpful, empathetic real-world advice for the tracking partner:
*   **Menstrual Phase:** Translates low energy and cramps into clear actions: *"Offer a warm heating pad," "Take over extra chores to allow them to rest," "Be patient with mood fluctuations."*
*   **Luteal Phase:** Translates elevated body temperature and fatigue into: *"Keep the bedroom cool tonight," "Offer a magnesium-rich snack," "Give them space to unwind."*
*   **Follicular & Ovulatory Phases:** Suggests date configurations, creative projects, and communication prompts that match active energy curves.

### 3. 🚀 Frictionless Syncing
Includes a native, integrated **Partner Invitation portal** powered by dynamic React hooks. It generates real-time secure access states without complex setups, syncing log changes instantly using cross-tab storage synchronizations.

### 4. 💎 Distraction-Free iOS Aesthetics
Avoids subscription paywalls, heavy advertisements, and clinical interfaces in favor of:
*   Frosted glassmorphism navigation tabs (`backdrop-blur-xl`).
*   Delightful tactile micro-interactions (`.active-squish`).
*   A premium dark mode designed with comforting warm-plum highlights.

---

## 🛠️ Tech Stack & Architecture

MensFlow is constructed with performance, stability, and pixel-perfection in mind:

*   **Runtime & Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) (fast HMR, Rolldown-backed bundling).
*   **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS variables.
*   **Routing:** [React Router v7](https://reactrouter.com/) for single-page routing and conditional navigation shells.
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence middleware.
*   **Data Vis:** [Recharts](https://recharts.org/) for beautiful, responsive charts.
*   **Iconography:** [Phosphor Icons](https://phosphoricons.com/) and [Lucide React](https://lucide.dev/).
*   **Animations:** Built-in transition utilities using [Tailwindcss Animate](https://github.com/jamiebuilds/tailwindcss-animate) and custom hardware-accelerated CSS transforms.
*   **Tour System:** [React Joyride](https://react-joyride.com/) for step-by-step introduction overlays.

---

## 📺 Detailed View & Page Documentation

The MensFlow application consists of several highly specialized, responsive page views located in [src/views](file:///Users/david/Downloads/MensFlow/src/views):

### 1. Dashboard View (`DashboardView.tsx`)
The home dashboard acts as the primary feed for tracking wellness scores, checking cycle progress, and accessing care recommendation lists.
*   **Ambient Background:** Dynamically shifts colors based on the current active phase (e.g., warm rose for menstrual, teal for follicular, sky-blue for fertile/ovulatory, amber for luteal).
*   **Stories Section:** Circular navigation hubs inspired by mobile social feeds to preview daily insights, chats, or wellness tips.
*   **Today's Plan Feed:** Renders active cards including `WellnessScoreCard`, `PrimaryInsightCard`, `BodySignalsCard`, `DailyTipCard`, and the `HormoneInsightCard`.
*   **Interactive Guided Tour:** Leverages `react-joyride` to showcase primary visual elements (Cycle Tracker, Story buttons, Today's Plan, and log triggers) for first-time users.
*   **Partner Pings:** Automatically listens for cross-browser storage pings to display live toast notifications if a partner logs an update.

### 2. Calendar View (`CalendarView.tsx`)
Provides a highly custom calendar grid displaying historical cycle details, symptom summaries, and future predictions.
*   **Visual Indicators:** Period days, predicted period days, follicular segments, and fertile segments are rendered with custom border highlights and pastel circles.
*   **Day Selection:** Selecting a day loads logged symptoms, cycle details, and partner care suggestions for that calendar date.

### 3. Ask MensFlow Companion (`ChatView.tsx`)
An AI-like messaging interface designed to discuss hormone cycles, diet suggestions, physical recovery, and relationship tips.
*   **Message Stream:** Premium layout with bubble styling, avatars, and bounce animations.
*   **Temporary Mode:** Optional setting to chat in an unsaved sandbox that leaves no trail in storage history.
*   **Locked Chats Sandbox:** Uses the exact same component structure but directs message array states to a distinct, passcode-locked localStorage entry (`mensflow_locked_chats`).

### 4. Locked Chats Security (`LockedChatsView.tsx`)
Restricts chat access behind a password-lock.
*   **Password Setup:** Formulates password guidelines (requiring mixed-case letters, symbols, numbers, and minimum lengths).
*   **Security Question Recovery:** If three incorrect password attempts are detected, the user can reset their password by answering a security question defined in settings.

### 5. Partner Sync Hub (`SyncView.tsx`)
Handles relationship-first collaboration functions.
*   **Real-Time Ping Sender:** Allows a user to instantly broadcast their active status (e.g., *"Crampy"*, *"Exhausted"*, *"Feeling Great!"*) to their partner. Uses a custom event listener that catches changes to `mensflow_partner_ping:v1`.
*   **Emotion Translator:** A helper widget that translates emotional outbursts or low-energy moments into biological context (e.g., high progesterone levels) for partner empathy.
*   **Support Actions Log:** Keeps track of support actions completed by the partner, computing streaks and rewarding collaborative behavior.

### 6. Symptoms View & Log Modal (`SymptomsView.tsx` & `LogSymptomsModal.tsx`)
Provides a grid to log flows, mood fluctuations, physical symptoms, and lifestyle markers.
*   **Log Symptoms Modal:** Allows selecting symptom buttons categorized into Flow, Mood, Physical, and Lifestyle. Includes a dynamic "Add Custom Symptom" control.
*   **Symptom Trends:** Detailed analytics visualizing symptom counts over time using custom AreaCharts and BarCharts.

### 7. Settings View (`SettingsView.tsx`)
Manages configuration models.
*   **Cycle Customizer:** Edit typical cycle lengths, typical period durations, and the date of the last period start.
*   **Privacy & Security:** Controls passcode encryption flags, security questions, custom passwords, and database clear procedures.
*   **Layout Tweaks:** Set dark/light modes, sidebar collapse behaviors, and mobile navigation overrides.

---

## 📂 Directory Layout

```bash
MensFlow/
├── public/                 # Static assets (fonts, icons, raw illustration SVGs)
├── src/
│   ├── assets/             # Bundled visual assets & images
│   ├── components/         # Reusable presentation & layout elements
│   │   ├── dashboard/      # Daily logs, feed progress banners, quick tips, Emotion Translator
│   │   ├── tracker/        # Hero grids, CycleWheel, custom Recharts graphs
│   │   └── ui/             # Core UI atoms (cards, modals, dropdowns, buttons, inputs)
│   ├── context/            # React global providers (Auth, Chat Session settings)
│   ├── data/               # Static mock records & medical correlation maps (symptoms, education, tips)
│   ├── hooks/              # Global custom hooks (e.g., useMediaQuery for responsive views)
│   ├── lib/                # Shared utilities, constants, cycle formulas, theme solvers, and storage helpers
│   ├── store/              # Zustand state manager (useStore.ts)
│   ├── types/              # Type definitions and interfaces
│   ├── views/              # Page-level route views (Dashboard, Insights, Tracker, Calendar, Onboarding)
│   ├── App.tsx             # Main routing engine, Shell layout, & Provider setups
│   ├── App.css             # Main styling layer (overrides, page templates, custom grid frameworks)
│   ├── index.css           # Tailwind base configuration, bespoke Design Tokens, & Dark Mode schemes
│   └── main.tsx            # Application entrypoint
├── vite.config.ts          # Vite build, alias configuration, and bundling policies
├── tsconfig.json           # Global TypeScript configuration
└── package.json            # Dependencies and development scripts
```

---

## 🎨 Bespoke Design System

The application relies on a unified hybrid design system configured in `src/index.css` and detailed inside `src/App.css`.

### CSS Custom Properties
MensFlow avoids cold, generic primaries in favor of an organic, premium palette utilizing warm cream bases, plum dark schemes, and elegant coral highlights:

```css
/* Light Theme Config */
[data-theme='light'] {
  --mf-main-bg: #fffafc;       /* Gentle soft warm cream */
  --mf-sidebar-bg: #fff5f8;   /* Light blush sidebar */
  --mf-card: #ffffff;
  --mf-accent: #ff6b8b;       /* Premium Rose/Peach */
  --mf-text: #3d3a43;         /* Warm charcoal (avoiding harsh #000) */
  --mf-text-strong: #0c0a10;  /* Deep dark plum */
}

/* Dark Theme Config */
[data-theme='dark'] {
  --mf-main-bg: #1a1318;       /* Deep warm dark plum */
  --mf-sidebar-bg: #1f161d;   /* Slightly deeper plum card container */
  --mf-card: #1f161d;
  --mf-accent: #ff8da1;       /* Soft glowing rose/peach */
  --mf-text: #c9c4d1;         /* Elegant warm lavender-grey */
  --mf-text-strong: #f4f2f8;  /* Sparkling white */
}
```

### Glassmorphism & Backdrop Blurs
The bottom mobile navigation uses frosted glassmorphism to look native on iOS devices. The content is blurred beneath the panel as the user scrolls.

```css
.flo-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: rgba(var(--mf-card-rgb, 255, 255, 255), 0.75);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-top: 1px solid var(--mf-border);
}
```

### Animations & Page Transitions
All main page components use staggered slide-ups and soft fades to guarantee buttery-smooth navigation transitions:

```css
/* Staggered page transition classes applied directly on views */
.animate-page-entry {
  animation: in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```
In React, simply append the tailwind classes: `animate-in fade-in slide-in-from-bottom-4 duration-700` to main outer container nodes.

### Micro-interactions & Tactile Squish
To simulate mobile haptics and keep the app feeling incredibly responsive, interactive cards feature a physics-based "squish" scale effect whenever tapped or clicked:

```css
/* Squish effect on active elements */
.active-squish {
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.active-squish:active {
  transform: scale(0.985);
}
```

---

## ⚡ State Management & Contexts

### Zustand Global Store
Global states (logs, dashboard statistics, user parameters, and persistent storage bindings) are centralized in [useStore.ts](file:///Users/david/Downloads/MensFlow/src/store/useStore.ts). 

> [!TIP]
> The store uses the Zustand `persist` middleware to automatically serialize/deserialize key states to local storage under the key `mensflow-storage`. It also simulates network latency (`1s` and `800ms`) on database saves to display premium loading overlays seamlessly across pages.

```typescript
interface AppState {
  dashboard: DashboardSnapshot
  settings: MensFlowSettings
  logs: SymptomLog[]
  user: { name: string }
  customSymptoms: SymptomDef[]
  isSaving: boolean
  completedActions: string[]
  supportStreak: number
  lastActionDate: string
  
  // Actions
  updateDashboard: (patch: Partial<DashboardSnapshot>) => Promise<void>
  updateUser: (patch: Partial<{ name: string }>) => void
  updateSettings: (patch: Partial<MensFlowSettings>) => void
  resetSettings: () => void
  addLog: (date: string, symptoms: string[]) => Promise<void>
  getLogForDate: (date: string) => SymptomLog | undefined
  clearLogs: () => void
  addCustomSymptom: (label: string, category: SymptomCategory) => void
  removeCustomSymptom: (id: string) => void
  resetStore: () => void
  toggleSupportAction: (actionId: string) => void
  checkAndResetDailyActions: () => void
}
```

### React Providers & Contexts
Additional configurations and session metrics are isolated inside specialized Context providers found under [src/context/](file:///Users/david/Downloads/MensFlow/src/context/):
*   `AuthProvider.tsx` — Handles auth states, registration modes, and onboarding checks.
*   `SettingsProvider.tsx` — Manages preferences like theme (light vs dark), mobile navigation settings, and desktop sidebar states.
*   `ChatSessionContext` — Shared in `App.tsx` to handle ephemeral chat sessions and routing setups.

---

## 🚀 Getting Started (Developer Guide)

Follow these steps to set up your local development environment:

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   `npm` (v9.0.0 or higher) or `bun` (v1.0.0 or higher)

### Setup Commands
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MensFlow
   ```
2. **Install all dependencies:**
   ```bash
   npm install
   # or with bun
   bun install
   ```
3. **Spin up the development environment:**
   ```bash
   npm run dev
   # or with bun
   bun dev
   ```
   *The local server will run on [http://localhost:5173/](http://localhost:5173/)*

4. **Verify TypeScript type safety (without compiling files):**
   ```bash
   npm run typecheck
   # or with bun
   bun run typecheck
   ```

5. **Lint and format checks:**
   ```bash
   npm run lint
   # or with bun
   bun run lint
   ```

6. **React quality diagnostics (React Doctor):**
   ```bash
   npm run doctor
   # or with bun
   bun run doctor
   ```

7. **Compile and build for production:**
   ```bash
   npm run build
   # or with bun
   bun run build
   ```
   *Compiles code and builds the production artifact into the `dist/` directory.*

---

## 🛠️ Adding New Features (Developer Walkthrough)

To add a new view (e.g., a "Hydration Tracker") to the application, follow this standard layout pattern:

### Step 1: Add state parameters to `useStore.ts`
If you need persistent state, update `AppState` inside `src/store/useStore.ts`:
```typescript
interface AppState {
  // ... existing states
  waterIntake: number;
  addWater: (amount: number) => void;
}
```

### Step 2: Create a beautiful view component
Create a file under `src/views/HydrationView.tsx`:
```tsx
import React from 'react';
import { useStore } from '../store/useStore';

export function HydrationView() {
  const { waterIntake, addWater } = useStore();

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flo-card active-squish p-6 bg-[var(--mf-card)]">
        <h1 className="text-2xl font-semibold text-[var(--mf-text-strong)]">Daily Hydration 💧</h1>
        <p className="text-[var(--mf-muted)] mt-2">Current Intake: {waterIntake} ml</p>
        <button 
          onClick={() => addWater(250)}
          className="mt-4 px-6 py-2 bg-[var(--mf-accent)] text-white rounded-full font-medium"
        >
          Add 250ml
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Register route and navigation nodes
Add the path configuration inside `src/App.tsx`:
```tsx
import { HydrationView } from './views/HydrationView';

// inside MainShell Route mapping:
<Route path="/hydration" element={<HydrationView />} />
```
Then, update `Sidebar.tsx` and the mobile navigation container in `App.tsx` (using Phosphor Icons) to give users an entrypoint to your new dashboard section.

---

## 🌿 Collaboration & Git Workflow

To maintain code quality and structural integrity across multiple developers:
*   We use a standardized branch naming convention (`type/short-description`).
*   All code changes must go through pull request review before merging.
*   For detailed instructions on branching protocols, commit conventions, and review procedures, refer to the [Collaboration and Branching Guide](file:///Users/david/Downloads/MensFlow/docs/collaboration_guide.md).
