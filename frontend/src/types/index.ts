// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  wakeTime: string;
  sleepTime: string;
  englishLevel: string;
  gymSchedule: string[];
  weakAreas: string[];
  strongAreas: string[];
  subjects: string[];
  xp: number;
  level: number;
  createdAt: string;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type GoalPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: Priority;
  period: GoalPeriod;
  deadline?: string;
  status: Status;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  streak: number;
  longestStreak: number;
  completionRate: number;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
  logs: HabitLog[];
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  startTime?: string;
  duration: number;
  completed: boolean;
  completedAt?: string;
  isAiGenerated: boolean;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityType =
  | "STUDY"
  | "CODING"
  | "REVISION"
  | "ENGLISH_SPEAKING"
  | "GYM"
  | "SLEEP"
  | "WATER"
  | "READING"
  | "MEDITATION";

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  duration?: number;
  amount?: number;
  notes?: string;
  loggedAt: string;
}

export interface ActivitySummary {
  date: string;
  summary: Record<
    string,
    { totalMinutes: number; totalAmount: number; count: number }
  >;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badgeImage: string;
  xpReward: number;
}

// ─── Daily Review ────────────────────────────────────────────────────────────

export interface DailyReview {
  id: string;
  userId: string;
  date: string;
  tasksCompleted: number;
  tasksMissed: number;
  productivityScore: number;
  disciplineScore: number;
  consistencyScore: number;
  suggestions: string;
  weeklyReport?: string;
}

// ─── Schedule Block ──────────────────────────────────────────────────────────

export interface ScheduleBlock {
  startTime: string;
  title: string;
  duration: number;
  description: string;
}
