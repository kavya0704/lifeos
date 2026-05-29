import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";
import { GamificationService } from "../services/gamificationService";

/**
 * Get all achievements and mark which ones are unlocked by the user.
 */
export async function getAchievements(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;

    // Ensure default achievements exist
    await GamificationService.ensureDefaultAchievementsExist();

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt])
    );

    const achievements = allAchievements.map((ach) => ({
      id: ach.id,
      name: ach.name,
      description: ach.description,
      badgeImage: ach.badgeImage,
      xpReward: ach.xpReward,
      unlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null,
    }));

    res.json({ achievements });
  } catch (error) {
    console.error("GetAchievements error:", error);
    res.status(500).json({ error: "Failed to fetch achievements." });
  }
}
