# MensFlow Backend API 🚀

Welcome to the **MensFlow Backend API**, the secure database persistence and notification engine for the MensFlow ecosystem. Built using **Express.js**, **TypeScript**, and **MongoDB (Mongoose)**, this backend coordinates user accounts, logs, partner sync states, automated daily reset schedules, and notifications.

---

## 🔍 What Does the Backend Actually Do?

The backend is responsible for providing data integrity, secure collaboration, and automated notifications for MensFlow:

### 1. 🔐 User Authentication & Profiles
*   Provides secure user registration and JWT-based authentication.
*   Stores baseline cycle parameters (e.g. cycle length, period duration, last period start date) to compute cycle states.
*   Enforces access levels between tracking accounts and partner accounts.

### 2. 📝 Symptom & Cycle History Logs
*   Exposes endpoints to save, retrieve, and delete daily physical, emotional, and flow symptom logs.
*   Persists secondary cycle metrics such as water intake, body temperature/weight, cervical mucus observations, and LH hormone levels.

### 3. 🤝 Partner Syncing & Empathy Hub Services
*   Handles partner connection tokens (generating secure sharing links, pairing invitations, and disconnecting relationships).
*   Manages real-time partner communication flags (e.g., storing check-in pings and translating them dynamically).
*   Tracks daily partner support checklists, computing streaks and managing streaking dates.

### 4. ⏰ Automated Schedules & Cron Tasks
*   Uses `node-cron` to execute daily maintenance tasks (e.g., checking if support streaks should be reset at midnight).
*   Coordinates mock and real notification dispatches (using `nodemailer` for email integrations).

### 5. 🛡️ API Security & Rate Limiting
*   Implements `express-rate-limit` to protect public endpoints (like login/onboarding) from spam.
*   Enforces JSON Web Token (JWT) verification on protected API routes.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js (Express)
*   **Language:** TypeScript
*   **Database ORM:** Mongoose (MongoDB)
*   **Security:** JSON Web Tokens (JWT), BcryptJS (password hashing)
*   **Scheduler:** Node-Cron
*   **Mailer:** Nodemailer

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   MongoDB (local instance running on `mongodb://localhost:27017/mensflow` or a MongoDB Atlas URI)

### Setup Instructions

1.  **Install dependencies:**
    ```bash
    npm install
    # or with bun
    bun install
    ```

2.  **Configure environment variables:**
    Create a `.env` file in the root of the `backend` folder (you can copy the format from `.env.example` if available). Example configurations:
    ```env
    PORT=5001
    MONGO_URI=mongodb://localhost:27017/mensflow
    JWT_SECRET=your_jwt_secret_token_here
    EMAIL_USER=your_email@example.com
    EMAIL_PASS=your_email_password
    FRONTEND_URL=http://localhost:5173
    ```

3.  **Run in development mode (with hot reloading):**
    ```bash
    npm run dev
    # or with bun
    bun dev
    ```
    _The server will start, by default, on [http://localhost:5001/](http://localhost:5001/)_

4.  **Build for production:**
    ```bash
    npm run build
    ```
    _Compiles TypeScript files into the `dist/` directory._

5.  **Run production build:**
    ```bash
    npm run start
    ```

---

## 📂 Directory Structure

```bash
backend/
├── src/
│   ├── config/             # Database connection, Mailer setups, rate limiters, and environment loader
│   ├── middleware/         # Auth checkers, error catchers, and validation guards
│   ├── models/             # Mongoose Schemas (User, SymptomLog, PartnerCode, PartnerSync)
│   ├── routes/             # Route handlers (auth, cycleLogs, partner, scheduler, user)
│   ├── services/           # Business logic (e.g. support action checks, cycle calculations, mail sender)
│   ├── utils/              # General helper functions and date formatters
│   └── index.ts            # Entrypoint file setting up Express middlewares and starting listeners
├── package.json
└── tsconfig.json
```
