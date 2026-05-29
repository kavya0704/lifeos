import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";

// ─── Get All Goals ───────────────────────────────────────────────────────────

export async function getGoals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { period, status } = req.query;

    const where: any = { userId: req.userId as string };
    if (period) where.period = period as string;
    if (status) where.status = status as string;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ goals });
  } catch (error) {
    console.error("GetGoals error:", error);
    res.status(500).json({ error: "Failed to fetch goals." });
  }
}

// ─── Create Goal ─────────────────────────────────────────────────────────────

export async function createGoal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, priority, period, deadline } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required." });
      return;
    }

    const goal = await prisma.goal.create({
      data: {
        userId: req.userId!,
        title,
        description,
        priority,
        period,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error("CreateGoal error:", error);
    res.status(500).json({ error: "Failed to create goal." });
  }
}

// ─── Update Goal ─────────────────────────────────────────────────────────────

export async function updateGoal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.updateMany({
      where: { id: id as string, userId: req.userId as string },
      data: req.body,
    });

    if (goal.count === 0) {
      res.status(404).json({ error: "Goal not found." });
      return;
    }

    const updated = await prisma.goal.findUnique({ where: { id: id as string } });
    res.json({ goal: updated });
  } catch (error) {
    console.error("UpdateGoal error:", error);
    res.status(500).json({ error: "Failed to update goal." });
  }
}

// ─── Delete Goal ─────────────────────────────────────────────────────────────

export async function deleteGoal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await prisma.goal.deleteMany({
      where: { id: id as string, userId: req.userId as string },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Goal not found." });
      return;
    }

    res.json({ message: "Goal deleted." });
  } catch (error) {
    console.error("DeleteGoal error:", error);
    res.status(500).json({ error: "Failed to delete goal." });
  }
}
