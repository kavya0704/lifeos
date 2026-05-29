"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Send,
  Sparkles,
  ArrowLeft,
  Loader2,
  User,
  CheckCircle2,
  Circle,
  Clock,
  Timer,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks";
import { aiAPI, tasksAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  startTime?: string;
  duration: number;
  completed: boolean;
  completedAt?: string;
  isAiGenerated: boolean;
  xpReward: number;
}

const PRESET_CHIPS = [
  "How can I optimize my study time today?",
  "Review my habits and suggest improvements.",
  "Give me a daily strategy to tackle my weak areas.",
  "I am feeling unmotivated today, help me focus.",
];

export default function CoachPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your LifeOS AI Coach. I have loaded your current goals, habits, and preferences. What would you like to focus on today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Schedule state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTasks = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await tasksAPI.getAll({ date: todayStr });
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks for coach:", error);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await tasksAPI.complete(id);
      await fetchTasks();
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await tasksAPI.delete(id);
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const isTaskMissed = (task: Task) => {
    if (task.completed) return false;
    if (!task.startTime) return false;
    const [hours, minutes] = task.startTime.split(":").map(Number);
    const taskTime = new Date(task.scheduledDate);
    taskTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(taskTime.getTime() + task.duration * 60 * 1000);
    return endTime < new Date();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const thread = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await aiAPI.chat(thread);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      // Trigger automatic re-fetching of tasks and user profile data to sync live changes
      fetchTasks();
      if (refreshUser) {
        refreshUser();
      }
    } catch (error) {
      console.error("AI Coach error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue connecting to the AI core. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // User context arrays for rendering
  const subjectsArray = user?.subjects || [];
  const strongAreasArray = user?.strongAreas || [];
  const weakAreasArray = user?.weakAreas || [];

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="ghost"
          size="icon"
          className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            AI Coach & Assistant
          </h1>
          <p className="text-xs text-muted-foreground">Contextual coaching powered by Llama 3 & Groq API</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ─── Chat Panel (col-span-3) ─────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0 glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-hide">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3.5 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    msg.role === "user" 
                      ? "bg-primary/20 border-primary/20 text-primary" 
                      : "bg-white/5 border-white/10 text-violet-400"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                    msg.role === "user"
                      ? "gradient-primary text-white border-primary/20 shadow-md"
                      : "bg-white/5 border-white/5 text-foreground"
                  }`}>
                    {/* Render basic markdown blocks like lists or newlines */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <div className="flex gap-3.5 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-violet-400">
                  <Brain className="w-4 h-4 animate-bounce" />
                </div>
                <div className="rounded-2xl p-4 bg-white/5 border border-white/5 text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Chips & Input Form */}
          <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
            {messages.length === 1 && !isSending && (
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendMessage(chip)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/5 hover:border-white/10 rounded-full px-3.5 py-1.5 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your Coach anything..."
                className="flex-1 bg-background/50 border border-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="gradient-primary text-white glow rounded-xl px-4 shrink-0"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* ─── Context Sidebar (col-span-1) ─────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-4 scrollbar-hide">
          <Card className="glass-card border border-white/10 shadow-xl shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Active Context Injected
              </CardTitle>
              <CardDescription className="text-[11px]">The AI Coach continuously checks these metrics during chats.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Level & XP */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2.5 rounded-xl">
                <span className="text-muted-foreground font-semibold">User Level</span>
                <span className="font-bold text-primary">Level {user?.level} ({user?.xp} XP)</span>
              </div>

              {/* Subjects */}
              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Subjects Focus</span>
                <div className="flex flex-wrap gap-1">
                  {subjectsArray.map(sub => (
                    <span key={sub} className="bg-primary/10 border border-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Strengths</span>
                <div className="flex flex-wrap gap-1">
                  {strongAreasArray.map(area => (
                    <span key={area} className="bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Areas to Improve</span>
                <div className="flex flex-wrap gap-1">
                  {weakAreasArray.map(area => (
                    <span key={area} className="bg-rose-500/10 border border-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule Card */}
          <Card className="glass-card border border-white/10 shadow-xl flex-1 flex flex-col min-h-[300px] overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                {"Today's Schedule"}
              </CardTitle>
              <CardDescription className="text-[11px]">Tasks sync in real-time when updated via AI chat.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 text-xs pr-1 scrollbar-hide">
              {isTasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="font-medium text-xs">No tasks scheduled today.</p>
                  <p className="text-[10px] mt-1">Ask the coach to add tasks or plan your day!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                        task.completed
                          ? "bg-emerald-500/5 border-emerald-500/10 text-muted-foreground animate-pulse-once"
                          : isTaskMissed(task)
                          ? "bg-rose-500/5 border-rose-500/10 text-muted-foreground"
                          : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => !task.completed && handleCompleteTask(task.id)}
                          disabled={task.completed}
                          className={`flex-shrink-0 transition-colors ${
                            task.completed ? "text-emerald-500 cursor-default" : "text-muted-foreground hover:text-primary"
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`font-semibold text-xs truncate ${task.completed ? "line-through opacity-60" : ""}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            {task.startTime && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-primary/70" />
                                {task.startTime}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Timer className="w-3 h-3 text-primary/70" />
                              {task.duration}m
                            </span>
                            {task.isAiGenerated && (
                              <span className="text-[8px] bg-primary/10 text-primary px-1 rounded font-bold uppercase">
                                AI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                          +{task.xpReward} XP
                        </span>
                        <Button
                          onClick={() => handleDeleteTask(task.id)}
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0 border-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
