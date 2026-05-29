import { Response } from "express";
import { prisma } from "../config";
import { AuthRequest } from "../middleware";
import { groqService } from "../services/groqService";
import { GamificationService } from "../services/gamificationService";

// Helper to safely extract JSON from LLM outputs (handling conversational prefaces/suffixes)
function extractAndParseJSON(text: string) {
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    const objStart = text.indexOf("{");
    const objEnd = text.lastIndexOf("}");
    if (objStart === -1 || objEnd === -1 || objEnd < objStart) {
      throw new Error("No JSON structure found in AI response.");
    }
    const jsonText = text.substring(objStart, objEnd + 1);
    return JSON.parse(jsonText);
  }
  
  const jsonText = text.substring(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonText);
}

// ─── Chat With AI Coach ───────────────────────────────────────────────────────

export async function chatWithCoach(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    // Retrieve user profile to inject context
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        goals: { where: { status: "PENDING" }, take: 5 },
        habits: { take: 5 },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Retrieve today's schedule to let AI Coach view and modify tasks
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const todayTasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        scheduledDate: { gte: start, lte: end },
      },
      orderBy: { startTime: "asc" },
    });

    // establish personal coaching context + database tool actions
    const systemPrompt = `You are LifeOS, a premium AI life coach and productivity mentor.
Your client is ${user.name}.
Here is their profile:
- Level: ${user.level} (XP: ${user.xp})
- Wake Time: ${user.wakeTime}
- Sleep Time: ${user.sleepTime}
- English Fluency: ${user.englishLevel}
- Subjects of Study: ${user.subjects}
- Weak Areas to Improve: ${user.weakAreas}
- Strong Areas: ${user.strongAreas}
- Gym Schedule Days: ${user.gymSchedule}
- Active Goals: ${user.goals.map((g) => g.title).join(", ") || "None"}
- Tracked Habits: ${user.habits.map((h) => h.name).join(", ") || "None"}

Here is their current schedule/tasks for today:
${todayTasks.map(t => `- [ID: ${t.id}] ${t.startTime || "No Time"} - ${t.title} (${t.duration} mins) [${t.completed ? "Completed" : "Pending"}]`).join("\n") || "No tasks scheduled for today"}

You can interactively modify the user's schedule if they ask you to add, reschedule, clear, update, or remove tasks.
You MUST respond with a single, valid JSON object containing exactly two keys:
1. "text": Your conversational coaching advice and responses (rendered in markdown).
2. "scheduleActions": An array of actions to apply to the user's schedule database:
   - To add a task: { "type": "ADD", "title": string, "startTime": "HH:MM", "duration": number (minutes) }
   - To update a task: { "type": "UPDATE", "id": string, "title"?: string, "startTime"?: string, "duration"?: number, "completed"?: boolean }
   - To delete a task: { "type": "DELETE", "id": string }
   - To clear today's tasks: { "type": "CLEAR_ALL" }
   - If no changes are needed, set "scheduleActions": []

Example outputs:
1. User: "add math study at 2pm" ->
{
  "text": "I've added the Math Study block at 2:00 PM today. Let me know when you finish it!",
  "scheduleActions": [{ "type": "ADD", "title": "Math Study", "startTime": "14:00", "duration": 60 }]
}
2. User: "how is my day going?" ->
{
  "text": "You have 3 tasks scheduled for today. Keep up the good work!",
  "scheduleActions": []
}

Remember: Your entire response must be a single parseable JSON object. Do not include any prefaces or postfaces.`;

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const aiResponse = await groqService.chat(fullMessages as any);

    let textResponse = aiResponse;
    let scheduleActions: any[] = [];

    // Attempt to parse the response as JSON actions
    try {
      const parsed = extractAndParseJSON(aiResponse);
      if (parsed && typeof parsed === "object") {
        textResponse = parsed.text || aiResponse;
        scheduleActions = parsed.scheduleActions || [];
      }
    } catch (parseError) {
      console.warn("Failed to parse coach chat response as JSON actions:", aiResponse, parseError);
    }

    // Execute database actions if any
    if (scheduleActions.length > 0) {
      for (const action of scheduleActions) {
        if (action.type === "ADD") {
          await prisma.task.create({
            data: {
              userId: req.userId!,
              title: action.title,
              scheduledDate: start,
              startTime: action.startTime,
              duration: action.duration || 30,
              isAiGenerated: true,
              xpReward: 20,
            },
          });
        } else if (action.type === "UPDATE" && action.id) {
          const existingTask = await prisma.task.findUnique({
            where: { id: action.id, userId: req.userId! },
          });
          if (existingTask) {
            const willComplete = action.completed === true && !existingTask.completed;
            await prisma.task.update({
              where: { id: action.id, userId: req.userId! },
              data: {
                title: action.title !== undefined ? action.title : undefined,
                startTime: action.startTime !== undefined ? action.startTime : undefined,
                duration: action.duration !== undefined ? action.duration : undefined,
                completed: action.completed !== undefined ? action.completed : undefined,
                completedAt: action.completed === true ? new Date() : (action.completed === false ? null : undefined),
              },
            });
            if (willComplete) {
              await GamificationService.awardXP(req.userId!, existingTask.xpReward);
              await GamificationService.checkAchievements(req.userId!);
            }
          }
        } else if (action.type === "DELETE" && action.id) {
          await prisma.task.delete({
            where: { id: action.id, userId: req.userId! },
          });
        } else if (action.type === "CLEAR_ALL") {
          await prisma.task.deleteMany({
            where: { userId: req.userId!, scheduledDate: { gte: start, lte: end } },
          });
        }
      }
    }

    res.json({ response: textResponse, scheduleActions });
  } catch (error) {
    console.error("ChatWithCoach error:", error);
    res.status(500).json({ error: "AI coach is temporarily offline." });
  }
}

// ─── Generate Daily Schedule ─────────────────────────────────────────────────

export async function generateSchedule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { description } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Gather context items
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });

    // Fetch active goals
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId, status: "PENDING" },
      select: { title: true },
    });

    // Fetch unfinished tasks
    const unfinishedTasks = await prisma.task.findMany({
      where: { userId: req.userId, completed: false, scheduledDate: { lt: today } },
      select: { title: true },
    });

    const parsedSubjects = user.subjects ? user.subjects.split(",").map(s => s.trim()) : [];
    const parsedGym = user.gymSchedule ? user.gymSchedule.split(",").map(g => g.trim()) : [];

    const scheduleResponse = await groqService.generateDailySchedule({
      userName: user.name,
      wakeTime: user.wakeTime,
      sleepTime: user.sleepTime,
      subjects: parsedSubjects,
      unfinishedTasks: unfinishedTasks.map((t) => t.title),
      goals: goals.map((g) => g.title),
      gymSchedule: parsedGym,
      todayDay,
      customDescription: description,
    });

    // Parse the JSON array from LLM response
    let scheduledBlocks = [];
    try {
      scheduledBlocks = extractAndParseJSON(scheduleResponse);
    } catch (parseError) {
      console.error("Failed to parse schedule response:", scheduleResponse, parseError);
      res.status(500).json({ error: "Failed to parse generated AI schedule format." });
      return;
    }

    // Clear existing AI-generated tasks for today to avoid duplicates
    await prisma.task.deleteMany({
      where: {
        userId: req.userId,
        scheduledDate: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
        completed: false,
        isAiGenerated: true,
      },
    });

    // Bulk insert new tasks into SQLite
    const createdTasks = [];
    for (const block of scheduledBlocks) {
      const task = await prisma.task.create({
        data: {
          userId: req.userId!,
          title: block.title,
          description: block.description,
          scheduledDate: new Date(),
          startTime: block.startTime,
          duration: block.duration || 30,
          isAiGenerated: true,
          xpReward: 20,
        },
      });
      createdTasks.push(task);
    }

    res.json({ tasks: createdTasks });
  } catch (error) {
    console.error("GenerateSchedule error:", error);
    res.status(500).json({ error: "Failed to generate AI schedule." });
  }
}

// ─── Generate Daily Performance Review ───────────────────────────────────────

export async function generateDailyReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Gathers tasks completed vs missed
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        scheduledDate: { gte: today, lt: tomorrow },
      },
    });

    const isTaskMissed = (task: any) => {
      if (task.completed) return false;
      if (!task.startTime) return false;
      const [hours, minutes] = task.startTime.split(":").map(Number);
      const taskTime = new Date(task.scheduledDate);
      taskTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(taskTime.getTime() + task.duration * 60 * 1000);
      return endTime < new Date();
    };

    const tasksCompleted = tasks.filter((t) => t.completed).length;
    const tasksMissed = tasks.filter((t) => isTaskMissed(t)).length;

    // 2. Gathers activities logged
    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        loggedAt: { gte: today, lt: tomorrow },
      },
    });

    const summaryMap: Record<string, number> = {};
    activities.forEach((a) => {
      if (a.duration) {
        summaryMap[a.type] = (summaryMap[a.type] || 0) + a.duration;
      }
    });
    const activitiesSummary = Object.entries(summaryMap)
      .map(([type, mins]) => `${type}: ${mins} minutes`)
      .join(", ") || "No activities logged today.";

    // 3. Gathers habit streaking details
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
    });
    const habitStreaks = habits
      .map((h) => `${h.name} (Streak: ${h.streak}d, Longest: ${h.longestStreak}d)`)
      .join(", ") || "No habits monitored.";

    // Query Groq SDK
    const reviewResponse = await groqService.generateDailyReview({
      userName: user.name,
      tasksCompleted,
      tasksMissed,
      activitiesSummary,
      habitStreaks,
    });

    let reviewData = { productivityScore: 0, disciplineScore: 0, consistencyScore: 0, suggestions: "" };
    try {
      reviewData = extractAndParseJSON(reviewResponse);
    } catch (parseError) {
      console.error("Failed to parse daily review response:", reviewResponse, parseError);
      res.status(500).json({ error: "Failed to parse daily review AI structure." });
      return;
    }

    // Save DailyReview record
    const dailyReview = await prisma.dailyReview.create({
      data: {
        userId: req.userId!,
        date: new Date(),
        tasksCompleted,
        tasksMissed,
        productivityScore: reviewData.productivityScore || 0,
        disciplineScore: reviewData.disciplineScore || 0,
        consistencyScore: reviewData.consistencyScore || 0,
        suggestions: reviewData.suggestions || "",
      },
    });

    // Award +100 XP to the user for completing the review
    const xpResult = await GamificationService.awardXP(req.userId!, 100);

    res.status(201).json({
      review: dailyReview,
      xpAwarded: 100,
      xp: xpResult.xp,
      level: xpResult.level,
      leveledUp: xpResult.leveledUp,
    });
  } catch (error) {
    console.error("GenerateDailyReview error:", error);
    res.status(500).json({ error: "Failed to run daily review evaluation." });
  }
}

// ─── Get Historical Daily Reviews ────────────────────────────────────────────

export async function getDailyReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const reviews = await prisma.dailyReview.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    res.json({ reviews });
  } catch (error) {
    console.error("GetDailyReviews error:", error);
    res.status(500).json({ error: "Failed to fetch daily reviews." });
  }
}
