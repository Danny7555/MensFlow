# MensFlow 🌸

MensFlow is a premium, beautifully designed health application tailored specifically for tracking menstrual cycles, symptom correlations, and providing holistic wellness tips. Originally designed to help partners track and support their significant other's cycles, it features a fluid, native-feeling user experience with rich micro-interactions and glassmorphism elements.

## Features ✨

- **Daily Symptom Logging:** Track physical, mood, and flow symptoms with a clean, intuitive interface.
- **Analytical Cycle Graphs & Trends:** Interactive charts (powered by Recharts) showcasing 6-month cycle length variations and long-term symptom correlations.
- **Personalized Insights:** Receive science-backed insights based on the current cycle phase.
- **Cycle Calendar:** Visual calendar to track past cycles and predict future phases.
- **Premium UX/UI:**
  - Soft, organic glassmorphism design (frosted glass navigation, soft gradients).
  - Fluid staggered page transitions and animations.
  - Satisfying "squish" micro-interactions mimicking native haptic feedback.
  - Dark mode support with a warm, deep plum palette.

## Tech Stack 🛠️

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Vanilla CSS (Custom Design System)
- **Routing:** React Router v7
- **State Management:** Zustand
- **Data Visualization:** Recharts
- **Icons:** Phosphor Icons & Lucide React
- **Animations:** Tailwind Animate & custom CSS keyframes

## Getting Started 🚀

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd MensFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Design System

The application relies heavily on a bespoke design system managed within `src/App.css` and `src/index.css`.
- **CSS Variables:** Drive the light/dark themes (`--mf-accent`, `--mf-card`, etc.).
- **Tailwind v4:** Extends utility classes while maintaining clean CSS structure.

## Branch Naming Convention

This document defines the standard naming format for Git branches to ensure clarity, consistency, and easier collaboration.

### Standard Format

`<type>/<short-description>`

- Use lowercase letters
- Separate words with hyphens
- Keep descriptions short and meaningful

### Allowed Branch Types

- `feature/` – new features
- `fix/` or `bugfix/` – bug fixes
- `hotfix/` – urgent production fixes
- `chore/` – maintenance, tooling, cleanup
- `docs/` – documentation updates
- `test/` – tests only
- `refactor/` – code restructuring (no behavior change)
- `release/` – release preparation
