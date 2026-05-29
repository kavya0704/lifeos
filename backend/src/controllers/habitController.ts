import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";
import { GamificationService } from "../services/gamificationService";

// ─── Get All Habits ──────────────────────────────────────────────────────────

export async function getHabits(req: AuthRequest, res: Response): Promise<void> {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId as string },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 days of logs
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ habits });
  } catch (error) {
    console.error("GetHabits error:", error);
    res.status(500).json({ error: "Failed to fetch habits." });
  }
}

// ─── Create Habit ────────────────────────────────────────────────────────────

export async function createHabit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: "Habit name is required." });
      return;
    }

    const habit = await prisma.habit.create({
      data: { userId: req.userId as string, name },
    });

    res.status(201).json({ habit });
  } catch (error) {
    console.error("CreateHabit error:", error);
    res.status(500).json({ error: "Failed to create habit." });
  }
}

// ─── Log Habit Completion ────────────────────────────────────────────────────

export async function logHabit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Verify ownership
    const habit = await prisma.habit.findFirst({
      where: { id: id as string, userId: req.userId as string },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found." });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert today's log
    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: id as string, date: today } },
      create: { habitId: id as string, date: today, completed: true },
      update: { completed: true },
    });

    // Recalculate streak
    const newStreak = habit.streak + 1;
    const longestStreak = Math.max(newStreak, habit.longestStreak);

    await prisma.habit.update({
      where: { id: id as string },
      data: { streak: newStreak, longestStreak },
    });

    // Check achievements
    const newlyUnlocked = await GamificationService.checkAchievements(req.userId!);

    res.json({ log, streak: newStreak, newlyUnlocked });
  } catch (error) {
    console.error("LogHabit error:", error);
    res.status(500).json({ error: "Failed to log habit." });
  }
}

// ─── Delete Habit ────────────────────────────────────────────────────────────

export async function deleteHabit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await prisma.habit.deleteMany({
      where: { id: id as string, userId: req.userId as string },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Habit not found." });
      return;
    }

    res.json({ message: "Habit deleted." });
  } catch (error) {
    console.error("DeleteHabit error:", error);
    res.status(500).json({ error: "Failed to delete habit." });
  }
}
