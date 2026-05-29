# 🧠 LifeOS — AI Life Operating System

> Your personal AI-powered Chief of Staff that manages every aspect of your daily life.

LifeOS combines the best of **Notion**, **Todoist**, **Google Calendar**, **Habitica**, and **ChatGPT** into one intelligent platform that helps you plan your day, track habits, analyze performance, improve productivity, and achieve long-term goals.

## ✨ Features

- **AI Daily Planner & Custom Schedule Generator** — Generates optimized daily schedules based on user preferences and custom text descriptions, powered by Groq Llama 3.
- **Task Alarm Alert System** — Fires desktop notifications and synthesizes dual-tone phone alarms using the browser Web Audio API when a task starts.
- **AI Coach Chat** — Conversational coaching page (`/dashboard/coach`) directly connected with your daily timetable to dynamically reschedule or add tasks in real-time.
- **Smart Habit Tracking** — Streak tracking, consistency metrics, and progress grids.
- **Goal Management** — Daily, weekly, monthly, and yearly goals.
- **Gamification Mechanics** — Seeding XP rewards, leveling up, achievements, and celebration overlays.
- **Focus Mode & Pomodoro** — Presets for deep work, custom countdown timer, visual indicators, distraction tracking, and synthesized end chime.
- **Analytics Dashboard** — Charts showcasing study focus, task performance trends, and streaking statistics.

## 🏗️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 15, React, TypeScript, Tailwind CSS   |
| UI         | Shadcn UI, Framer Motion, Recharts            |
| Backend    | Node.js, Express.js, TypeScript               |
| Database   | SQLite (file:./dev.db), Prisma ORM            |
| Package Mgr| pnpm workspaces                               |
| AI         | Groq API (Llama 3.3 70B Model)                |
| Auth       | JWT tokens                                    |

## 📂 Project Structure

```
lifeos/
├── backend/          # Express.js API server
│   ├── prisma/       # SQLite DB Schema
│   └── src/          # API Server source code
├── frontend/         # Next.js 15 web application
│   └── src/          # App router, components, hooks
├── package.json      # Monorepo workspaces configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (Recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kavya0704/lifeos.git
   cd lifeos
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_jwt_secret_key"
   GROQ_API_KEY="your_groq_api_key"
   ```

4. Run database migrations / push schema:
   ```bash
   cd backend
   npx prisma db push
   cd ..
   ```

5. Start the development servers:
   ```bash
   pnpm dev
   ```

The frontend will run on `http://localhost:3000` and the backend API on `http://localhost:5000`.

## 📄 License

MIT
