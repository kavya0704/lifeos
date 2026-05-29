import { prisma } from "../config";

/**
 * GamificationService — Manages XP, levels, and achievement unlocking.
 */
export class GamificationService {
  // XP required for next level: 100 * currentLevel^1.5
  static xpForNextLevel(currentLevel: number): number {
    return Math.floor(100 * Math.pow(currentLevel, 1.5));
  }

  /**
   * Award XP to a user and level up if threshold is reached.
   */
  static async awardXP(userId: string, amount: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) throw new Error("User not found");

    let newXP = user.xp + amount;
    let newLevel = user.level;
    let leveledUp = false;

    // Check for level ups (could be multiple)
    while (newXP >= this.xpForNextLevel(newLevel)) {
      newXP -= this.xpForNextLevel(newLevel);
      newLevel++;
      leveledUp = true;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });

    return { xp: newXP, level: newLevel, leveledUp };
  }

  /**
   * Ensure standard default achievements exist in the database.
   */
  static async ensureDefaultAchievementsExist(): Promise<void> {
    const defaults = [
      {
        id: "study_streak_7",
        name: "7 Day Study Streak",
        description: "Log study or coding activities on 7 consecutive days",
        badgeImage: "🔥",
        xpReward: 100,
      },
      {
        id: "english_streak_30",
        name: "30 Day English Streak",
        description: "Log English Speaking activities on 30 consecutive days",
        badgeImage: "🗣️",
        xpReward: 500,
      },
      {
        id: "study_hours_100",
        name: "100 Hours Study Badge",
        description: "Accumulate 100 hours of study or coding activities",
        badgeImage: "🎓",
        xpReward: 1000,
      },
      {
        id: "consistency_champion",
        name: "Consistency Champion",
        description: "Complete all scheduled tasks for 5 consecutive days",
        badgeImage: "🏆",
        xpReward: 300,
      },
    ];

    for (const item of defaults) {
      await prisma.achievement.upsert({
        where: { name: item.name },
        update: { 
          id: item.id, // Ensure we align the ID with default key
          description: item.description, 
          badgeImage: item.badgeImage, 
          xpReward: item.xpReward 
        },
        create: item,
      });
    }
  }

  /**
   * Check and unlock achievements for a user.
   * Returns any newly unlocked achievement names.
   */
  static async checkAchievements(userId: string): Promise<string[]> {
    try {
      await this.ensureDefaultAchievementsExist();

      const newlyUnlocked: string[] = [];

      // Get already unlocked achievement IDs to skip checking them
      const unlocked = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const unlockedIds = new Set(unlocked.map((ua: { achievementId: string }) => ua.achievementId));

      // 1. Check 7 Day Study Streak
      if (!unlockedIds.has("study_streak_7")) {
        const studyLogs = await prisma.activityLog.findMany({
          where: {
            userId,
            type: { in: ["STUDY", "CODING"] },
          },
          select: { loggedAt: true },
          orderBy: { loggedAt: "asc" },
        });

        if (this.hasConsecutiveDaysStreak(studyLogs.map((l: { loggedAt: Date }) => l.loggedAt), 7)) {
          await this.unlockAchievement(userId, "study_streak_7");
          newlyUnlocked.push("7 Day Study Streak");
        }
      }

      // 2. Check 30 Day English Streak
      if (!unlockedIds.has("english_streak_30")) {
        const englishLogs = await prisma.activityLog.findMany({
          where: {
            userId,
            type: "ENGLISH_SPEAKING",
          },
          select: { loggedAt: true },
          orderBy: { loggedAt: "asc" },
        });

        if (this.hasConsecutiveDaysStreak(englishLogs.map((l: { loggedAt: Date }) => l.loggedAt), 30)) {
          await this.unlockAchievement(userId, "english_streak_30");
          newlyUnlocked.push("30 Day English Streak");
        }
      }

      // 3. Check 100 Hours Study Badge
      if (!unlockedIds.has("study_hours_100")) {
        const totalMinutes = await prisma.activityLog.aggregate({
          where: {
            userId,
            type: { in: ["STUDY", "CODING"] },
          },
          _sum: { duration: true },
        });

        const sumMinutes = totalMinutes._sum.duration || 0;
        if (sumMinutes >= 6000) { // 100 hours = 6000 minutes
          await this.unlockAchievement(userId, "study_hours_100");
          newlyUnlocked.push("100 Hours Study Badge");
        }
      }

      // 4. Check Consistency Champion
      if (!unlockedIds.has("consistency_champion")) {
        const tasks = await prisma.task.findMany({
          where: { userId },
          select: { scheduledDate: true, completed: true },
          orderBy: { scheduledDate: "asc" },
        });

        if (this.hasTaskConsistencyStreak(tasks, 5)) {
          await this.unlockAchievement(userId, "consistency_champion");
          newlyUnlocked.push("Consistency Champion");
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error("CheckAchievements error:", error);
      return [];
    }
  }

  /**
   * Helper to unlock an achievement and reward user with XP.
   */
  private static async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
      },
    });

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { xpReward: true },
    });

    if (achievement) {
      await this.awardXP(userId, achievement.xpReward);
    }
  }

  /**
   * Helper to check for a streak of consecutive calendar days.
   */
  private static hasConsecutiveDaysStreak(dates: Date[], requiredDays: number): boolean {
    if (dates.length === 0) return false;

    // Get unique local dates sorted
    const uniqueDates = Array.from(
      new Set(dates.map((d) => new Date(d).toLocaleDateString()))
    ).map((dStr) => new Date(dStr)).sort((a, b) => a.getTime() - b.getTime());

    if (uniqueDates.length < requiredDays) return false;

    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const diffTime = uniqueDates[i].getTime() - uniqueDates[i - 1].getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    return maxStreak >= requiredDays;
  }

  /**
   * Helper to check for consecutive days of completing all tasks.
   */
  private static hasTaskConsistencyStreak(tasks: { scheduledDate: Date; completed: boolean }[], requiredDays: number): boolean {
    if (tasks.length === 0) return false;

    // Group tasks by date
    const tasksByDate: Record<string, { total: number; completed: number }> = {};
    for (const task of tasks) {
      const dStr = new Date(task.scheduledDate).toLocaleDateString();
      if (!tasksByDate[dStr]) {
        tasksByDate[dStr] = { total: 0, completed: 0 };
      }
      tasksByDate[dStr].total++;
      if (task.completed) {
        tasksByDate[dStr].completed++;
      }
    }

    // Find all dates where there was at least 1 task and all tasks were completed
    const consistentDates = Object.keys(tasksByDate)
      .filter((dStr) => tasksByDate[dStr].total > 0 && tasksByDate[dStr].total === tasksByDate[dStr].completed)
      .map((dStr) => new Date(dStr))
      .sort((a, b) => a.getTime() - b.getTime());

    if (consistentDates.length < requiredDays) return false;

    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < consistentDates.length; i++) {
      const diffTime = consistentDates[i].getTime() - consistentDates[i - 1].getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    return maxStreak >= requiredDays;
  }
}

export const gamificationService = GamificationService;
