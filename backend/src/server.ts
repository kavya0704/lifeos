import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoutes, goalRoutes, habitRoutes, taskRoutes, activityRoutes, aiRoutes, achievementRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

// ─── Load Environment ────────────────────────────────────────────────────────

dotenv.config();

// ─── Create Express App ──────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "LifeOS API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/achievements", achievementRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   🧠 LifeOS API Server                      ║
  ║   Running on http://localhost:${PORT}          ║
  ║   Environment: ${(process.env.NODE_ENV || "development").padEnd(28)}║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;
