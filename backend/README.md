# MensFlow Backend API 🚀

[← Back to Root README](../README.md)

Express + TypeScript + MongoDB (Mongoose) API powering MensFlow. Deployed on Vercel as a serverless function with a cron webhook route (`vercel.json`).

- **Port:** `5001` (dev)
- **Auth:** JWT (jsonwebtoken) + bcrypt + OTP email (Nodemailer)
- **Scheduler:** node-cron
- **Docs:** See root `README.md` for endpoint list; see `docs/project_overview.md` for architecture.

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
│   ├── config/           # MongoDB connection, mailer (Nodemailer), rate limiter, env loader
│   ├── controllers/      # auth, cycle, chat, education, email, partner, user, wellnessTip
│   ├── interfaces/       # TypeScript types/interfaces
│   ├── middleware/       # authenticate (JWT), rateLimiter, error handler
│   ├── models/           # Mongoose: User, Chat, Partner, Log, Dashboard, Settings,
│   │                    # Symptom, EducationArticle, WellnessTip, LoginHistory
│   ├── routes/           # auth, cycle, partner, scheduler, user, support,
│   │                    # education, wellnessTip
│   ├── services/         # auth (OTP), cycle, chat, email, partner,
│   │                    # scheduler (node-cron), user
│   ├── utils/            # cycle model, http helpers, validators, seeders
│   └── index.ts          # Express server entry + CORS
├── vercel.json           # Serverless + cron webhook route
├── migrations/           # Schema migrations (historical)
├── package.json
└── tsconfig.json
```
