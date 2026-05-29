import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";
import { GamificationService } from "../services/gamificationService";

// ─── Get Tasks ───────────────────────────────────────────────────────────────

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { date, completed } = req.query;

    const where: any = { userId: req.userId as string };

    if (date) {
      const start = new Date(date as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);
      where.scheduledDate = { gte: start, lte: end };
    }

    if (completed !== undefined) {
      where.completed = completed === "true";
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    res.json({ tasks });
  } catch (error) {
    console.error("GetTasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
}

// ─── Create Task ─────────────────────────────────────────────────────────────

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, scheduledDate, startTime, duration } = req.body;

    if (!title || !scheduledDate) {
      res.status(400).json({ error: "Title and scheduled date are required." });
      return;
    }

    const task = await prisma.task.create({
      data: {
        userId: req.userId as string,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        startTime,
        duration: duration || 30,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error("CreateTask error:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
}

// ─── Complete Task ───────────────────────────────────────────────────────────

export async function completeTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await prisma.task.updateMany({
      where: { id: id as string, userId: req.userId as string },
      data: { completed: true, completedAt: new Date() },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: id as string } });

    // Check achievements
    const newlyUnlocked = await GamificationService.checkAchievements(req.userId!);

    res.json({ task, newlyUnlocked });
  } catch (error) {
    console.error("CompleteTask error:", error);
    res.status(500).json({ error: "Failed to complete task." });
  }
}

// ─── Update Task ─────────────────────────────────────────────────────────────

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await prisma.task.updateMany({
      where: { id: id as string, userId: req.userId as string },
      data: req.body,
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: id as string } });
    res.json({ task });
  } catch (error) {
    console.error("UpdateTask error:", error);
    res.status(500).json({ error: "Failed to update task." });
  }
}

// ─── Delete Task ─────────────────────────────────────────────────────────────

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await prisma.task.deleteMany({
      where: { id: id as string, userId: req.userId as string },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    res.json({ message: "Task deleted." });
  } catch (error) {
    console.error("DeleteTask error:", error);
    res.status(500).json({ error: "Failed to delete task." });
  }
}
