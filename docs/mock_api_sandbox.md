# MensFlow Mock API & Local Sandbox Guide 🛠️

[← Back to README](file:///Users/david/Downloads/MensFlow/README.md) | [← Back to Project Overview](file:///Users/david/Downloads/MensFlow/docs/project_overview.md)

When developing a frontend application that will integrate with a backend, we can avoid development blocks by running a **Local Mock API Server**. This allows developers and AI systems to write real HTTP client code (`fetch` or `axios`) inside Zustand store actions immediately, without waiting for the server to be finished.

This document describes how to configure environment variables, setup a local JSON-Server mock backend, and toggle between local mock databases and production services.

---

## 📖 Table of Contents
1. [Environment Configurations (`.env` Rules)](#-environment-configurations-env-rules)
2. [Setting Up a Mock API Server (JSON-Server)](#-setting-up-a-mock-api-server-json-server)
3. [Seeding Mock Database Schema (`db.json`)](#-seeding-mock-database-schema-dbjson)
4. [Toggling Mock Client Middleware in Zustand](#-toggling-mock-client-middleware-in-zustand)

---

## ⚙️ Environment Configurations (`.env` Rules)

Vite uses environment variables to adjust build behaviors. We define three environments using `.env` files in the root folder:

### 1. File: `.env.development` (Local Mock Server)
For running frontend code pointing to a local mock server:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_USE_MOCK_API=true
```

### 2. File: `.env.staging` (Staging Cloud Backend)
For pointing to a cloud-based sandbox backend:
```env
VITE_API_URL=https://staging-api.mensflow.app/api
VITE_WS_URL=wss://staging-api.mensflow.app
VITE_USE_MOCK_API=false
```

### 3. Accessing Variables in Code
Always access environment variables using Vite's import context:
```typescript
const apiEndpoint = import.meta.env.VITE_API_URL
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true'
```

---

## 📦 Setting Up a Mock API Server (JSON-Server)

`json-server` is an npm package that creates a fully functional REST API backed by a single local JSON file (`db.json`). It supports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests automatically.

### 1. Install JSON-Server
To install JSON-Server as a development dependency:
```bash
npm install --save-dev json-server
# or with bun
bun add -d json-server
```

### 2. Add Running Script to `package.json`
Add a `"mock-server"` script to the scripts list:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "mock-server": "json-server --watch mock-db/db.json --port 3001",
  "typecheck": "tsc -b --noEmit",
  "lint": "eslint .",
  "doctor": "npx react-doctor@latest"
}
```

---

## 🗄️ Seeding Mock Database Schema (`db.json`)

Create a directory called `mock-db` at the root, and add a `db.json` file inside it. This serves as the seed database representing dashboards, logs, and streaks.

### File Structure: `mock-db/db.json`
```json
{
  "profiles": [
    {
      "id": "user-daniella",
      "name": "Daniella",
      "partnerName": "David"
    }
  ],
  "dashboards": [
    {
      "id": "dashboard-1",
      "userId": "user-daniella",
      "lastPeriodStart": "2026-05-18",
      "typicalCycleDays": 28,
      "typicalPeriodDays": 5,
      "hormoneTrend": "Estrogen slowly climbing",
      "bodySignals": ["Light cramping", "Increased energy"]
    }
  ],
  "logs": [
    {
      "id": "log-1",
      "date": "2026-05-18",
      "symptoms": ["flow-light", "phys-cramps"]
    },
    {
      "id": "log-2",
      "date": "2026-05-19",
      "symptoms": ["flow-medium", "phys-cramps", "phys-fatigue"]
    }
  ],
  "supportActions": [
    {
      "id": "action-tea",
      "label": "Brew herbal tea",
      "completed": true,
      "date": "2026-05-23"
    },
    {
      "id": "action-pad",
      "label": "Offer a heating pad",
      "completed": false,
      "date": "2026-05-23"
    }
  ]
}
```

---

## 🔀 Toggling Mock Client Middleware in Zustand

To handle requests gracefully in the store, we can use an abstraction helper (an API client) that checks if mock mode is active:

### 1. Create client utility (`src/lib/apiClient.ts`)
```typescript
import { SymptomLog } from '../store/useStore'

const API_URL = import.meta.env.VITE_API_URL
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

export const apiClient = {
  async fetchLogs(): Promise<SymptomLog[]> {
    if (USE_MOCK) {
      // Direct call to local JSON-server
      const res = await fetch(`${API_URL}/logs`)
      return res.json()
    } else {
      // Real API request containing authentication headers
      const token = localStorage.getItem('mensflow_auth_token')
      const res = await fetch(`${API_URL}/cycle/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.json()
    }
  },

  async saveLog(date: string, symptoms: string[]): Promise<SymptomLog> {
    const payload = { date, symptoms }
    const url = USE_MOCK ? `${API_URL}/logs` : `${API_URL}/cycle/logs`
    const token = localStorage.getItem('mensflow_auth_token')
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (!USE_MOCK && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    return res.json()
  }
}
```

By placing this wrapper client between the Zustand store and the network layer, developers can switch backend endpoints in seconds just by changing a value in their local `.env` configuration.
