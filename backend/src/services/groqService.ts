import { groqClient, GROQ_MODEL } from "../config";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

/**
 * GroqService — Handles all AI inference calls via the Groq API.
 * Provides methods for chat completion, daily planning, reviews, and coaching.
 */
export class GroqService {
  /**
   * Send a chat completion request to Groq with the given messages.
   */
  async chat(messages: ChatCompletionMessageParam[]): Promise<string> {
    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Generate a structured daily schedule based on user context.
   * Returns a JSON array of time-blocked tasks.
   */
  async generateDailySchedule(context: {
    userName: string;
    wakeTime: string;
    sleepTime: string;
    subjects: string[];
    unfinishedTasks: string[];
    goals: string[];
    gymSchedule: string[];
    todayDay: string;
    customDescription?: string;
  }): Promise<string> {
    const systemPrompt = `You are LifeOS, an AI life manager and productivity coach. 
Generate an optimized daily schedule for the user based on their profile, goals, unfinished tasks, and any custom instructions they provide.
Return the schedule as a JSON array with objects containing: { "startTime": "HH:MM", "title": string, "duration": number (minutes), "description": string }.
Be realistic with time allocations. Include breaks and meals.`;

    let userPrompt = `User: ${context.userName}
Wake Time: ${context.wakeTime}
Sleep Time: ${context.sleepTime}
Today: ${context.todayDay}
Subjects: ${context.subjects.join(", ")}
Unfinished Tasks: ${context.unfinishedTasks.join(", ") || "None"}
Current Goals: ${context.goals.join(", ") || "None"}
Gym Days: ${context.gymSchedule.join(", ")}\n`;

    if (context.customDescription) {
      userPrompt += `Custom Schedule Instructions: "${context.customDescription}"\n`;
    }

    userPrompt += `\nGenerate today's optimized schedule.`;

    return this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
  }

  /**
   * Generate an AI daily review summary.
   */
  async generateDailyReview(context: {
    userName: string;
    tasksCompleted: number;
    tasksMissed: number;
    activitiesSummary: string;
    habitStreaks: string;
  }): Promise<string> {
    const systemPrompt = `You are LifeOS, an AI accountability partner and life coach.
Generate a comprehensive daily review for the user. Be encouraging but honest.
Include: productivity score (0-100), discipline score (0-100), consistency score (0-100), and actionable suggestions.
Return as JSON: { "productivityScore": number, "disciplineScore": number, "consistencyScore": number, "suggestions": string }`;

    const userPrompt = `User: ${context.userName}
Tasks Completed: ${context.tasksCompleted}
Tasks Missed: ${context.tasksMissed}
Activities: ${context.activitiesSummary}
Habit Streaks: ${context.habitStreaks}

Generate the daily review.`;

    return this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
  }
}

export const groqService = new GroqService();
