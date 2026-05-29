import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";
import { GamificationService } from "../services/gamificationService";

// ─── Log Activity ────────────────────────────────────────────────────────────

export async function logActivity(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { type, duration, amount, notes } = req.body;

    if (!type) {
      res.status(400).json({ error: "Activity type is required." });
      return;
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        type,
        duration,
        amount,
        notes,
      },
    });

    // Check achievements
    const newlyUnlocked = await GamificationService.checkAchievements(req.userId!);

    res.status(201).json({ activity, newlyUnlocked });
  } catch (error) {
    console.error("LogActivity error:", error);
    res.status(500).json({ error: "Failed to log activity." });
  }
}

// ─── Get Activity Logs ───────────────────────────────────────────────────────

export async function getActivities(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { type, from, to } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };

    if (type) where.type = type;

    if (from || to) {
      where.loggedAt = {};
      if (from) (where.loggedAt as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.loggedAt as Record<string, unknown>).lte = new Date(to as string);
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { loggedAt: "desc" },
      take: 100,
    });

    res.json({ activities });
  } catch (error) {
    console.error("GetActivities error:", error);
    res.status(500).json({ error: "Failed to fetch activities." });
  }
}

// ─── Get Activity Summary ────────────────────────────────────────────────────

export async function getActivitySummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        loggedAt: { gte: today, lt: tomorrow },
      },
    });

    // Aggregate durations by type
    const summary: Record<string, { totalMinutes: number; totalAmount: number; count: number }> = {};

    for (const activity of activities) {
      if (!summary[activity.type]) {
        summary[activity.type] = { totalMinutes: 0, totalAmount: 0, count: 0 };
      }
      summary[activity.type].count++;
      if (activity.duration) summary[activity.type].totalMinutes += activity.duration;
      if (activity.amount) summary[activity.type].totalAmount += activity.amount;
    }

    res.json({ date: today.toISOString().split("T")[0], summary });
  } catch (error) {
    console.error("GetActivitySummary error:", error);
    res.status(500).json({ error: "Failed to fetch activity summary." });
  }
}
