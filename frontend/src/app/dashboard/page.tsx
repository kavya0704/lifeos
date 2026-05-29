"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  BellRing,
  Code2,
  Dumbbell,
  Droplets,
  Moon,
  Languages,
  RotateCcw,
  CalendarPlus,
  Sparkles,
  Target,
  Activity,
  Timer,
  Loader2,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ListTodo,
  AlertTriangle,
  Flame,
  Check,
  Award,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks";
import {
  tasksAPI,
  habitsAPI,
  goalsAPI,
  activitiesAPI,
  aiAPI,
} from "@/lib/api";
import { Task, Habit, Goal, ActivityType, Priority, GoalPeriod, ActivitySummary } from "@/types";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

interface DailyReviewResponse {
  review: {
    id: string;
    productivityScore: number;
    disciplineScore: number;
    consistencyScore: number;
    suggestions: string;
  };
  xpAwarded: number;
  xp: number;
  level: number;
  leveledUp: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

  // API Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Dialog State
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isHabitOpen, setIsHabitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Loading States
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [dailyReviewData, setDailyReviewData] = useState<DailyReviewResponse | null>(null);

  // Custom Plan Description State
  const [scheduleDescription, setScheduleDescription] = useState("");

  // Alarm & Notifications states
  const [alarmedTaskIds, setAlarmedTaskIds] = useState<string[]>([]);
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
  
  // Refs for repeating alarm sound
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Achievement Unlocked states
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<string[]>([]);

  // Synthesize sound via Web Audio API
  const playAchievementUnlockSound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playNote(523.25, now, 0.4); // C5
      playNote(659.25, now + 0.15, 0.4); // E5
      playNote(783.99, now + 0.3, 0.4); // G5
      playNote(1046.50, now + 0.45, 1.0); // C6
    } catch (e) {
      console.error("Audio synth error:", e);
    }
  };

  // Activity Log Form State
  const [activityType, setActivityType] = useState<ActivityType>("STUDY");
  const [activityDuration, setActivityDuration] = useState("");
  const [activityAmount, setActivityAmount] = useState("");
  const [activityNotes, setActivityNotes] = useState("");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskDuration, setTaskDuration] = useState("30");

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalPriority, setGoalPriority] = useState<Priority>("MEDIUM");
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>("DAILY");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Habit Form State
  const [habitName, setHabitName] = useState("");

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [tasksRes, habitsRes, goalsRes, summaryRes] = await Promise.all([
        tasksAPI.getAll({ date: todayStr }),
        habitsAPI.getAll(),
        goalsAPI.getAll(),
        activitiesAPI.getSummary(),
      ]);

      setTasks(tasksRes.data.tasks || []);
      setHabits(habitsRes.data.habits || []);
      setGoals(goalsRes.data.goals || []);
      setActivitySummary(summaryRes.data || null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);


  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user) {
        if (!user.subjects || user.subjects.length === 0) {
          router.push("/onboarding");
        } else {
          fetchDashboardData();
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, fetchDashboardData]);

  // Web Notification requester
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const triggerNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body });
        } catch (e) {
          console.warn("Desktop notification failed to trigger", e);
        }
      }
    }
  };

  // Stop alarm sound
  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    setActiveAlarmTask(null);
  }, []);

  // Play repeating synthetic beeps / alarm chimes
  const triggerAlarmSound = useCallback((task: Task) => {
    stopAlarm();
    setActiveAlarmTask(task);

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      let step = 0;
      alarmIntervalRef.current = setInterval(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Beautiful alternating G5 and E5 chime sound
        const freq = step % 2 === 0 ? 783.99 : 659.25; // G5 and E5
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        step++;
      }, 650);

      // Auto stop after 30 seconds
      alarmTimeoutRef.current = setTimeout(() => {
        stopAlarm();
      }, 30000);
    } catch (err) {
      console.error("Alarm audio playback failed:", err);
    }
  }, [stopAlarm]);

  // Check schedule alarms every 10 seconds
  useEffect(() => {
    if (tasks.length === 0) return;

    const checkScheduleAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`; // e.g. "14:30"

      tasks.forEach((task) => {
        if (task.completed) return;
        if (!task.startTime) return;
        if (alarmedTaskIds.includes(task.id)) return;

        if (task.startTime === currentTimeStr) {
          setAlarmedTaskIds((prev) => [...prev, task.id]);
          triggerNotification("⏰ LifeOS Task Alert!", `It is time to start "${task.title}"!`);
          triggerAlarmSound(task);
        }
      });
    };

    const checker = setInterval(checkScheduleAlarms, 10000);
    return () => clearInterval(checker);
  }, [tasks, alarmedTaskIds, triggerAlarmSound]);

  // Clean up alarm sound on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
    };
  }, []);

  // Greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Task Actions
  const handleCompleteTask = async (id: string) => {
    try {
      const res = await tasksAPI.complete(id);
      await fetchDashboardData();
      await refreshUser();

      const badges = res.data.newlyUnlocked || [];
      if (badges.length > 0) {
        setNewlyUnlockedBadges(badges);
        setShowAchievementsModal(true);
        playAchievementUnlockSound();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await tasksAPI.delete(id);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Habit Actions
  const handleToggleHabit = async (id: string) => {
    try {
      const res = await habitsAPI.log(id);
      await fetchDashboardData();
      await refreshUser();

      const badges = res.data.newlyUnlocked || [];
      if (badges.length > 0) {
        setNewlyUnlockedBadges(badges);
        setShowAchievementsModal(true);
        playAchievementUnlockSound();
      }
    } catch (error) {
      console.error("Error logging habit:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await habitsAPI.delete(id);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  // Goal Actions
  const handleCompleteGoal = async (id: string) => {
    try {
      await goalsAPI.update(id, { status: "COMPLETED" });
      await fetchDashboardData();
      await refreshUser();
    } catch (error) {
      console.error("Error completing goal:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await goalsAPI.delete(id);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  // AI Schedule Generator (Groq Llama 3)
  const handleGenerateSchedule = async () => {
    if (isScheduleLoading) return;
    setIsScheduleLoading(true);
    try {
      await aiAPI.generateSchedule(scheduleDescription);
      await fetchDashboardData();
      setScheduleDescription("");
    } catch (error) {
      console.error("Error generating schedule:", error);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  // AI Daily Performance Review (Groq Llama 3)
  const handleGenerateReview = async () => {
    if (isReviewLoading) return;
    setIsReviewLoading(true);
    try {
      const { data } = await aiAPI.generateReview();
      setDailyReviewData(data);
      setIsReviewOpen(true);
      await fetchDashboardData();
      await refreshUser();
    } catch (error) {
      console.error("Error generating daily review:", error);
    } finally {
      setIsReviewLoading(false);
    }
  };

  // Form Submissions
  const handleLogActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duration = activityDuration ? parseInt(activityDuration) : undefined;
      const amount = activityAmount ? parseFloat(activityAmount) : undefined;
      const res = await activitiesAPI.log({
        type: activityType,
        duration,
        amount,
        notes: activityNotes || undefined,
      });
      setIsActivityOpen(false);
      setActivityDuration("");
      setActivityAmount("");
      setActivityNotes("");
      await fetchDashboardData();
      await refreshUser();

      const badges = res.data.newlyUnlocked || [];
      if (badges.length > 0) {
        setNewlyUnlockedBadges(badges);
        setShowAchievementsModal(true);
        playAchievementUnlockSound();
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduledDate = new Date().toISOString().split("T")[0];
      const duration = taskDuration ? parseInt(taskDuration) : undefined;
      await tasksAPI.create({
        title: taskTitle,
        scheduledDate,
        startTime: taskStartTime || undefined,
        duration,
      });
      setIsTaskOpen(false);
      setTaskTitle("");
      setTaskStartTime("");
      setTaskDuration("30");
      await fetchDashboardData();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalsAPI.create({
        title: goalTitle,
        description: goalDescription || undefined,
        priority: goalPriority,
        period: goalPeriod,
        deadline: goalDeadline || undefined,
      });
      setIsGoalOpen(false);
      setGoalTitle("");
      setGoalDescription("");
      setGoalPriority("MEDIUM");
      setGoalPeriod("DAILY");
      setGoalDeadline("");
      await fetchDashboardData();
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleAddHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await habitsAPI.create({ name: habitName });
      setIsHabitOpen(false);
      setHabitName("");
      await fetchDashboardData();
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  // Calculate dynamic stats
  const studyMin = activitySummary?.summary?.["STUDY"]?.totalMinutes || 0;
  const revisionMin = activitySummary?.summary?.["REVISION"]?.totalMinutes || 0;
  const englishMin = activitySummary?.summary?.["ENGLISH_SPEAKING"]?.totalMinutes || 0;
  const codingMin = activitySummary?.summary?.["CODING"]?.totalMinutes || 0;
  const gymMin = activitySummary?.summary?.["GYM"]?.totalMinutes || 0;
  const sleepMin = activitySummary?.summary?.["SLEEP"]?.totalMinutes || 0;
  const waterAmt = activitySummary?.summary?.["WATER"]?.totalAmount || 0;

  const todayStats = [
    { label: "Study Hours", value: `${(studyMin / 60).toFixed(1)}h`, icon: BookOpen, color: "text-blue-500" },
    { label: "Revision", value: `${(revisionMin / 60).toFixed(1)}h`, icon: RotateCcw, color: "text-emerald-500" },
    { label: "English", value: `${(englishMin / 60).toFixed(1)}h`, icon: Languages, color: "text-amber-500" },
    { label: "Coding", value: `${(codingMin / 60).toFixed(1)}h`, icon: Code2, color: "text-violet-500" },
    { label: "Gym", value: `${gymMin}m`, icon: Dumbbell, color: "text-rose-500" },
    { label: "Sleep", value: sleepMin > 0 ? `${(sleepMin / 60).toFixed(1)}h` : "—", icon: Moon, color: "text-indigo-400" },
    { label: "Water", value: `${waterAmt.toFixed(1)}L`, icon: Droplets, color: "text-cyan-500" },
  ];

  // Productivity Score logic
  const isTaskMissed = (task: Task) => {
    if (task.completed) return false;
    if (!task.startTime) return false;
    const [hours, minutes] = task.startTime.split(":").map(Number);
    const taskTime = new Date(task.scheduledDate);
    taskTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(taskTime.getTime() + task.duration * 60 * 1000);
    return endTime < new Date();
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const missedTasks = tasks.filter((t) => isTaskMissed(t)).length;
  const pendingTasks = totalTasks - completedTasks - missedTasks;
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading || !isAuthenticated || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Syncing tracking engines...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            {getGreeting()}, {user?.name || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Level {user?.level || 1}</span>
            <span className="text-xs text-muted-foreground">• {user?.xp || 0} XP</span>
          </div>
        </div>
      </motion.div>

      {/* ─── Productivity Score ──────────────────────────────────────── */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="glass-card border border-white/10 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 w-full">
                <p className="text-sm text-muted-foreground mb-1">Today&apos;s Productivity</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold gradient-text">{productivityScore}%</span>
                  <span className="text-sm text-muted-foreground">score</span>
                </div>
                <Progress value={productivityScore} className="mt-3 h-2" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground font-medium">{completedTasks} tasks completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground font-medium">{pendingTasks} tasks pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-muted-foreground font-medium">{missedTasks} tasks missed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Stats Grid ─────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {todayStats.map((stat, idx) => (
          <motion.div key={stat.label} variants={fadeInUp} transition={{ duration: 0.3, delay: idx * 0.03 }}>
            <Card className="glass-card border border-white/5 hover:scale-[1.03] hover:border-primary/20 transition-all duration-300 cursor-default shadow-md">
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Today's Schedule & Habits ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass-card border border-white/10 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <ListTodo className="w-5 h-5 text-primary" />
                  Today&apos;s Schedule
                </CardTitle>
                {tasks.length > 0 && (
                  <Button
                    onClick={() => setIsTaskOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-primary text-xs hover:bg-primary/10 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <CalendarPlus className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm mb-4">
                      No tasks scheduled for today yet. Let our engine generate an optimized plan, or create custom tasks!
                    </p>
                    <div className="w-full max-w-md mb-4 bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                      <p className="text-left text-xs text-muted-foreground font-semibold">{"Today's Schedule Instructions (Optional)"}</p>
                      <textarea
                        value={scheduleDescription}
                        onChange={(e) => setScheduleDescription(e.target.value)}
                        placeholder="Describe your plan... (e.g. 'Study math in the morning, coding at 3pm, gym at 6pm')"
                        className="w-full min-h-[60px] bg-background/50 border border-input rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleGenerateSchedule}
                        disabled={isScheduleLoading}
                        className="gradient-primary text-white rounded-xl glow hover:scale-[1.02] transition-transform"
                      >
                        {isScheduleLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {isScheduleLoading ? "Generating Plan..." : "Generate Today's Schedule"}
                      </Button>
                      <Button
                        onClick={() => setIsTaskOpen(true)}
                        variant="outline"
                        className="glass border-white/10 rounded-xl hover:bg-white/5"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Task
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                          task.completed
                            ? "bg-emerald-500/5 border-emerald-500/10 text-muted-foreground"
                            : isTaskMissed(task)
                            ? "bg-rose-500/5 border-rose-500/10 text-muted-foreground"
                            : "bg-white/5 border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <button
                            onClick={() => !task.completed && handleCompleteTask(task.id)}
                            disabled={task.completed}
                            className={`flex-shrink-0 transition-colors ${
                              task.completed ? "text-emerald-500 cursor-default" : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${task.completed ? "line-through opacity-60" : ""}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {task.startTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary/70" />
                                  {task.startTime}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3 text-primary/70" />
                                {task.duration} min
                              </span>
                              {task.isAiGenerated && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  AI
                                </span>
                              )}
                              {!task.completed && isTaskMissed(task) && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Missed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            +{task.xpReward} XP
                          </span>
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Habits */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="glass-card border border-white/10 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Flame className="w-5 h-5 text-rose-500" />
                  Daily Habits Checklist
                </CardTitle>
                <Button
                  onClick={() => setIsHabitOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-rose-500 text-xs hover:bg-rose-500/10 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Habit
                </Button>
              </CardHeader>
              <CardContent>
                {habits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No habits set up yet. Start tracking to build consistency.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {habits.map((habit) => {
                      const completedToday = habit.logs?.some((log) => {
                        const logDate = new Date(log.date).toDateString();
                        const todayDate = new Date().toDateString();
                        return logDate === todayDate && log.completed;
                      });

                      return (
                        <div
                          key={habit.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                            completedToday
                              ? "bg-rose-500/5 border-rose-500/10 text-muted-foreground"
                              : "bg-white/5 border-white/5 hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <button
                              onClick={() => !completedToday && handleToggleHabit(habit.id)}
                              disabled={completedToday}
                              className={`flex-shrink-0 transition-colors ${
                                completedToday ? "text-rose-500 cursor-default" : "text-muted-foreground hover:text-rose-400"
                              }`}
                            >
                              {completedToday ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${completedToday ? "line-through opacity-60" : ""}`}>
                                {habit.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs mt-0.5 text-muted-foreground">
                                <span className="flex items-center gap-0.5 text-rose-500 font-bold">
                                  <Flame className="w-3 h-3 fill-rose-500" />
                                  {habit.streak}d streak
                                </span>
                                <span>•</span>
                                <span>Rate: {Math.round(habit.completionRate * 100)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs font-bold text-rose-500 bg-rose-500/5 px-2.5 py-1 rounded-lg">
                              +{habit.xpReward} XP
                            </span>
                            <Button
                              onClick={() => handleDeleteHabit(habit.id)}
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Right Column: Quick Actions & Goals ─────────────────────── */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="glass-card border border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                  <p className="text-left text-xs text-muted-foreground font-semibold">{"AI Schedule Instructions (Optional)"}</p>
                  <textarea
                    value={scheduleDescription}
                    onChange={(e) => setScheduleDescription(e.target.value)}
                    placeholder="Describe your plan... (e.g. 'Gym in morning, focus coding after 2pm')"
                    className="w-full min-h-[60px] bg-background/50 border border-input rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isScheduleLoading}
                  className="w-full justify-start gap-3 rounded-xl py-5 gradient-primary text-white glow hover:scale-[1.02] transition-transform"
                >
                  {isScheduleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="w-4 h-4" />
                  )}
                  {isScheduleLoading ? "Generating Schedule..." : "Generate AI Schedule"}
                </Button>
                <Button
                  onClick={handleGenerateReview}
                  disabled={isReviewLoading}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  {isReviewLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  {isReviewLoading ? "Analyzing Performance..." : "Daily Performance Review"}
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/coach")}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <MessageSquare className="w-4 h-4 text-violet-400 animate-pulse" />
                  Talk to AI Coach
                </Button>
                <Button
                  onClick={() => setIsTaskOpen(true)}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <ListTodo className="w-4 h-4 text-primary" />
                  Add Custom Task
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/focus")}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Start Focus Session
                </Button>
                <Button
                  onClick={() => setIsGoalOpen(true)}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <Target className="w-4 h-4 text-emerald-500" />
                  Add Goal
                </Button>
                <Button
                  onClick={() => setIsHabitOpen(true)}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  Add Habit
                </Button>
                <Button
                  onClick={() => setIsActivityOpen(true)}
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl py-5 glass hover:bg-white/5 border-white/10"
                >
                  <Activity className="w-4 h-4 text-violet-500" />
                  Log Activity
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Goals */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="glass-card border border-white/10 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Active Goals
                </CardTitle>
                <Button
                  onClick={() => setIsGoalOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-emerald-500 text-xs hover:bg-emerald-500/10 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Goal
                </Button>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No active goals. Set goals to define your direction.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {goals.filter(g => g.status !== "COMPLETED").map((goal) => (
                      <div
                        key={goal.id}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:border-white/15 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-tight break-words">{goal.title}</p>
                            {goal.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                                goal.priority === "HIGH"
                                  ? "bg-rose-500/10 text-rose-500"
                                  : goal.priority === "MEDIUM"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-blue-500/10 text-blue-500"
                              }`}>
                                {goal.priority}
                              </span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {goal.period}
                              </span>
                              {goal.deadline && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(goal.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md">
                              +{goal.xpReward} XP
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <Button
                                onClick={() => handleCompleteGoal(goal.id)}
                                variant="ghost"
                                size="icon-sm"
                                className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteGoal(goal.id)}
                                variant="ghost"
                                size="icon-sm"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ─── Dialogs ────────────────────────────────────────────────── */}

      {/* Log Activity Dialog */}
      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Log Activity
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogActivitySubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full mt-1 bg-background/50 border border-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="STUDY">Study</option>
                <option value="CODING">Coding</option>
                <option value="REVISION">Revision</option>
                <option value="ENGLISH_SPEAKING">English Speaking</option>
                <option value="GYM">Gym</option>
                <option value="SLEEP">Sleep</option>
                <option value="WATER">Water</option>
                <option value="READING">Reading</option>
                <option value="MEDITATION">Meditation</option>
              </select>
            </div>
            {activityType !== "WATER" && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration (minutes)</label>
                <Input
                  type="number"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                  required
                  min="1"
                />
              </div>
            )}
            {activityType === "WATER" && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (Liters)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={activityAmount}
                  onChange={(e) => setActivityAmount(e.target.value)}
                  placeholder="e.g. 0.5"
                  className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                  required
                  min="0.1"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="What did you accomplish?"
                className="w-full mt-1 h-20 bg-background/50 border border-input rounded-xl p-3 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsActivityOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-white glow rounded-xl">
                Log Activity
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" /> Add Task
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTaskSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Task Title</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Solve 3 Leetcode questions"
                className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start Time</label>
                <Input
                  type="time"
                  value={taskStartTime}
                  onChange={(e) => setTaskStartTime(e.target.value)}
                  className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration (minutes)</label>
                <Input
                  type="number"
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(e.target.value)}
                  placeholder="30"
                  className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsTaskOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-white glow rounded-xl">
                Add Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" /> Add Goal
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoalSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goal Title</label>
              <Input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Master React hooks deep dive"
                className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Details or action steps..."
                className="w-full mt-1 h-20 bg-background/50 border border-input rounded-xl p-3 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                <select
                  value={goalPriority}
                  onChange={(e) => setGoalPriority(e.target.value as Priority)}
                  className="w-full mt-1 bg-background/50 border border-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Period</label>
                <select
                  value={goalPeriod}
                  onChange={(e) => setGoalPeriod(e.target.value as GoalPeriod)}
                  className="w-full mt-1 bg-background/50 border border-input rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deadline</label>
              <Input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsGoalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-white glow rounded-xl">
                Add Goal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Habit Dialog */}
      <Dialog open={isHabitOpen} onOpenChange={setIsHabitOpen}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" /> Add Habit
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHabitSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Habit Name</label>
              <Input
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="e.g. Read 15 mins daily"
                className="w-full mt-1 bg-background/50 h-10 px-3 rounded-xl border-input"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsHabitOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-white glow rounded-xl">
                Add Habit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Daily Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-lg p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> AI Daily Performance Review
            </DialogTitle>
          </DialogHeader>
          {dailyReviewData && (
            <div className="space-y-6 mt-4">
              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Productivity</p>
                  <p className="text-2xl font-black text-primary mt-1">{dailyReviewData.review.productivityScore}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Discipline</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{dailyReviewData.review.disciplineScore}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Consistency</p>
                  <p className="text-2xl font-black text-rose-400 mt-1">{dailyReviewData.review.consistencyScore}%</p>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Suggestions & Insights</p>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-sm max-h-60 overflow-y-auto leading-relaxed text-foreground whitespace-pre-wrap">
                  {dailyReviewData.review.suggestions}
                </div>
              </div>

              {/* Reward feedback */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Review XP Claimed!</p>
                    <p className="text-[10px] text-muted-foreground">Earned +100 XP for today&apos;s evaluation</p>
                  </div>
                </div>
                <span className="text-sm font-black text-primary">+{dailyReviewData.xpAwarded} XP</span>
              </div>

              {/* Level up notifier if it happened */}
              {dailyReviewData.leveledUp && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3 text-amber-500">
                  <Award className="w-8 h-8 animate-bounce shrink-0" />
                  <div>
                    <p className="text-sm font-bold">LEVEL UP!</p>
                    <p className="text-xs">Congratulations! You advanced to Level {dailyReviewData.level}!</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsReviewOpen(false)} className="gradient-primary text-white glow rounded-xl px-6">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Achievements Unlocked Dialog */}
      <Dialog open={showAchievementsModal} onOpenChange={setShowAchievementsModal}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 glow">
            <Award className="w-10 h-10 text-amber-500 animate-bounce" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text text-transparent text-center">
              Achievement Unlocked!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Congratulations! You have unlocked a new badge and earned bonus XP:
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {newlyUnlockedBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl text-left"
              >
                <span className="text-3xl">🔥</span>
                <div>
                  <h4 className="font-bold text-sm text-white">{badge}</h4>
                  <p className="text-xs text-muted-foreground">Bonus XP has been credited to your profile.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => setShowAchievementsModal(false)}
              className="gradient-primary text-white glow rounded-xl px-8 py-2 font-bold"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alarm Triggered Dialog */}
      <Dialog open={!!activeAlarmTask} onOpenChange={() => stopAlarm()}>
        <DialogContent className="glass-card border border-white/10 dark:border-white/5 text-foreground max-w-md p-6 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
          
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 glow animate-bounce">
            <BellRing className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-white via-rose-200 to-red-300 bg-clip-text text-transparent text-center">
              Task Alarm Starting!
            </DialogTitle>
          </DialogHeader>
          
          {activeAlarmTask && (
            <div className="mt-4 mb-6 space-y-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <h4 className="font-extrabold text-lg text-white">{activeAlarmTask.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled Start Time: {activeAlarmTask.startTime || "Now"} ({activeAlarmTask.duration} minutes)
                </p>
                {activeAlarmTask.description && (
                  <p className="text-sm text-foreground mt-3 italic border-t border-white/5 pt-3">
                    &quot;{activeAlarmTask.description}&quot;
                  </p>
                )}
              </div>
              <p className="text-xs text-rose-400 font-semibold animate-pulse">
                Alarm is ringing... (auto-silences in 30 seconds)
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => stopAlarm()}
              variant="outline"
              className="glass border-white/10 rounded-xl px-6 py-2.5 font-bold hover:bg-white/5 text-xs sm:text-sm"
            >
              Dismiss Alarm
            </Button>
            <Button
              onClick={async () => {
                if (activeAlarmTask) {
                  const taskId = activeAlarmTask.id;
                  stopAlarm();
                  await handleCompleteTask(taskId);
                }
              }}
              className="gradient-primary text-white glow rounded-xl px-6 py-2.5 font-bold text-xs sm:text-sm"
            >
              Complete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

