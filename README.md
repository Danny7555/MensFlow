# MensFlow 🌸

MensFlow is a menstrual health and relationship support app. It helps trackers log their cycle and symptoms, and it helps partners understand what's happening — so they can show up better.

Two people. One cycle. Less guessing, more empathy.

---

## What it feels like to use

You open the app and the background glows in a soft rose or deep plum, depending on your chosen theme. The home screen tells you: today is day 14 of your cycle, you're in the follicular phase, and your next period is expected in 14 days. No hunt for answers, no blank screen.

Tap **Log** and you're in a clean grid of symptoms — flow, mood, cramps, sleep, temperature — all organized so your thumb can reach them. Tap what applies. Done.

Swipe to **Insights** and you see six months of cycle length trends in a soft chart, your most common symptoms listed by frequency, and a button to download a PDF you can bring to a doctor.

Tap **Ask** and you're chatting with a companion that knows your cycle phase. It answers in plain language: "Since you're in the luteal phase, progesterone is rising. That can make sleep lighter. Try magnesium and a cooler room tonight."

Your partner sees a different home screen. Their dashboard says: "She's in the luteal phase. Common feelings right now: fatigue, warmth, need for calm." Below that: three small actions — "Prepare a heating pad," "Pick up a magnesium snack," "Run a foot bath." They tap one. A streak starts building.

---

## What you can do

**Track your cycle**
See your cycle day, current phase, and next expected period. The calendar lights up with your follicular, fertile, luteal, and menstrual windows so everything makes sense at a glance.

**Log symptoms fast**
Tap to log flow, mood, physical feelings, sleep, BBT, LH levels, and cervical mucus. The app remembers your patterns over time.

**Ask MensFlow**
Chat with the companion for hormone questions, diet ideas, recovery tips, and stress management — in plain language, no clinic jargon.

**Lock private chats**
Passcode-protected conversations stay private. Three wrong attempts trigger a security-question recovery, so you don't lock yourself out.

**Sync with your partner**
Send a quick status ping (“Crampy”, “Exhausted”, “Feeling great!”), get an automatic empathy translation for your current phase, and build a daily support-streak together.

**See trends and export reports**
Look back at cycle length changes, symptom patterns, and wellness scores. Download a CSV or PDF for doctor check-ins.

**Learn as you go**
Read phase-relevant educational content. Partners in educational mode see a focused experience built around health articles.

**Set the mood**
Warm cream or deep plum dark mode. Frosted glass navigation. Tactile button feedback. Phase-colored ambient backgrounds. Everything is designed to feel calm, not clinical.

---

## The four phases

The app organizes your cycle into four windows, each with its own colors, tips, and partner guidance:

- **Menstrual** (days 1 through roughly day 5) — Warm rose tones. The focus is rest and comfort. Partners see: "Handle the chores, offer warmth, be patient with mood changes."

- **Follicular** (after menstruation until the fertile window opens) — Teal and emerald tones. Energy is rising. Partners see: "Plan something active, encourage social time, initiate a small gesture."

- **Fertile** (around ovulation, roughly days 12–16 in a 28-day cycle) — Sky-blue tones. Peak physical and social energy. Partners see: "Schedule something nice, leave a note, try a creative connection."

- **Luteal** (after the fertile window until your next period) — Amber and gold tones. Energy starts to slow. Partners see: "Pick up a comfort snack, avoid heavy conversations, offer a foot or back massage."

These aren't just labels. They drive the app's background colors, the wellness tips you see, and the empathy translations your partner receives. The cycle math adapts to your real cycle length, so a 25-day cycle and a 34-day cycle both get sensible phase boundaries.

---

## Onboarding — what to expect

The first time you open MensFlow, you'll land on a short setup that takes about a minute. It asks two things: who you are, and what your cycle looks like.

**Step 1: Choose your role**
You pick either **Lady** (I'm tracking my cycle) or **Partner** (I'm supporting someone). This shapes everything that follows — the home screen, the features you see, and the way the app talks to you.

**Step 2: Set your cycle baseline**
You enter three pieces of information:

- Your typical cycle length (how many days from the first day of one period to the first day of the next)
- Your typical period duration (how many days bleeding usually lasts)
- The start date of your last period

That's it. The app uses these to figure out your current cycle day, your active phase, and when to expect your next period. If your cycle shifts over time, you can update these numbers anytime in Settings.

**Step 3: Start using the app**
Once onboarding is done, you land on your home dashboard. If you're a tracker, you'll see your cycle status, daily tips, and a log button. If you're a partner, you'll see your tracker's current phase, empathy translations, and support actions you can complete.

There's no long questionnaire, no medical history form, no pressure to get every detail right on day one. The app learns with you.

---

## Who it's for

**For the tracker**
Log everything that matters: flow, moods, cramps, sleep, temperature, LH, and mucus. See predictions, trends, and daily tips that actually match where you are in your cycle. Lock private chats. Export reports. Everything stays organized in one place instead of scattered across notes apps and calendar reminders.

**For the partner**
Receive pings, get plain-language empathy translations, and complete small support actions that build connection over time. You don't need to be a doctor or a biologist — the app tells you what your partner needs right now in everyday language.

---

## Privacy, explained simply

Your health data is sensitive. MensFlow gives you real control:

- **Access levels** — Your detailed symptom logs are never visible to a partner who is in educational mode. That mode is designed for programs like Ghanaian adolescent health education, where partners should see only curated health content.

- **Passcode vault** — Private chats sit behind a password you choose. Type it wrong three times and the app asks your security question instead of locking you out permanently.

- **Local-only mode** — A switch in settings stops all uploads to the server. When it's on, nothing leaves your device. Period.

- **Clean logout** — When your login expires, the app signs you out and takes you back to the home page. No error screens, no data left behind in a broken state.

---

## How the pieces fit together

Behind the scenes, the app has three layers:

```
 Your phone or browser
        ↕ HTTPS
    Express backend API
        ↕ Mongoose
     MongoDB database
```

The **frontend** is a React app that runs on your device. It handles the screens you see, the animations, the calendar, the charts, the chat, and every tap and swipe. It's built to feel fast even on slower connections by showing updates immediately and syncing in the background.

The **backend** is an Express API. It verifies logins, saves your logs, sends partner invite emails, serves education content, and runs a small scheduler for daily resets. In development it lives at `localhost:5001`. In production it lives on Vercel.

The **database** is MongoDB. It stores user accounts, cycle profiles, symptom logs, partner connections, chat history, and app settings. It's the single source of truth once the frontend finishes its backend migration.

Right now the app is in a hybrid state: some things like theme preference and sidebar layout stay on the device only, while logs, streaks, and profiles sync to the backend. The team is actively moving everything toward full server sync.

---

## Built with

- **React 19** — the UI layer
- **TypeScript** — type safety across the whole stack
- **Vite** — fast development and builds
- **Express** — backend API
- **MongoDB with Mongoose** — data storage
- **Zustand** — lightweight state management
- **Recharts** — the trend charts you see in Insights
- **Tailwind CSS** — the styling system under the warm colors and rounded corners
- **Framer Motion** — the page transitions and micro-interactions
- **node-cron** — the small scheduler that handles daily resets

---

## For developers who want to contribute

The codebase is split into two folders: `frontend/` and `backend/`. The frontend holds all the views, components, styling, and state logic. The backend holds the API routes, database models, and business logic.

The views live in `frontend/src/views/`. Each screen is lazy-loaded so the app starts quickly. Global state lives in `frontend/src/store/useStore.ts` — that's where logs, dashboard data, settings, and support streaks are managed. Styling uses CSS custom properties under the `--mf-` prefix, which means you should never hardcode a color value in a component. Use the existing tokens instead.

When you're ready to add a route, add it in `frontend/src/App.tsx` alongside the other lazy imports, then link it in the sidebar or bottom navigation.

---

## Get started

```bash
git clone <your-repo-url>
cd MensFlow
```

Run the frontend:

```bash
cd frontend && npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:5173/`.

Run the backend:

```bash
cd backend && npm install
```

Create a `.env` file inside `backend/` with your database and email settings:

```
PORT=5001
MONGO_URI=mongodb://localhost:27017/mensflow
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

Then start the API:

```bash
npm run dev
```

This starts Express at `http://localhost:5001/`.

Run both together in two terminal windows: one for the frontend, one for the backend.

---

## Quality checks before opening a PR

```bash
npm run typecheck   # TypeScript compilation check
npm run lint        # Code style and syntax
npm run doctor      # React best-practices scan
npm run build       # Full production build
```

All four should pass before you open a pull request.

---

## Adding something new

1. Add state in `frontend/src/store/useStore.ts` if you need to remember something across screens
2. Build a view in `frontend/src/views/`
3. Add the route in `frontend/src/App.tsx`
4. Link it in the sidebar or bottom nav
5. Use the existing design tokens — no raw colors

---

## Branching and PRs

- Branches use the pattern `type/short-description` in kebab-case
- Commits follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- PRs are squash-merged and need at least one review
- The main branch is protected; every merge deploys to production

For the full guide: `docs/collaboration_guide.md`.
