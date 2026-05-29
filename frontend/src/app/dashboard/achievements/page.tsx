"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/hooks";
import { achievementsAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface AchievementItem {
  id: string;
  name: string;
  description: string;
  badgeImage: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function AchievementsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchAchievements();
      }
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchAchievements = async () => {
    try {
      const res = await achievementsAPI.getAll();
      setAchievements(res.data.achievements || []);
    } catch (err) {
      console.error("Error fetching achievements:", err);
    } finally {
      setLoadingData(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#07090e] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // XP calculation
  const level = user?.level || 1;
  const currentXP = user?.xp || 0;
  const xpNeeded = Math.floor(100 * Math.pow(level, 1.5));
  const xpPercentage = Math.min(100, Math.floor((currentXP / xpNeeded) * 100));

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#07090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#07090e] to-[#07090e] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
              Achievements & Badges
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Unlock awards by maintaining streaks, completing tasks, and logging study hours.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-blue-950/20 border border-blue-500/20 px-4 py-2 rounded-2xl glass-card">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
          </div>
        </div>

        {/* Level & Progress Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md glow-card relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center shadow-lg glow relative">
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wide">Level</span>
                <span className="text-2xl font-black text-white leading-none">{level}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-1.5">
                  Performance Status <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-muted-foreground">
                  Complete goals and AI coaching suggestions to level up!
                </p>
              </div>
            </div>
            <div className="text-right sm:text-right w-full sm:w-auto">
              <span className="text-2xl font-black text-blue-400">{currentXP}</span>
              <span className="text-muted-foreground text-sm font-medium"> / {xpNeeded} XP</span>
            </div>
          </div>
          <Progress value={xpPercentage} className="h-3 rounded-full bg-slate-800 border border-white/5" />
          <p className="text-right text-xs text-muted-foreground mt-2">
            {xpNeeded - currentXP} XP required to reach Level {level + 1}
          </p>
        </motion.div>

        {/* Grid List */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {achievements.map((achievement) => (
            <motion.div key={achievement.id} variants={cardVariants}>
              <Card
                className={`relative overflow-hidden border transition-all duration-300 rounded-2xl glass-card h-full ${
                  achievement.unlocked
                    ? "bg-slate-900/30 border-blue-500/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
                    : "bg-slate-950/40 border-white/5 opacity-70"
                }`}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  {/* Badge Frame */}
                  <div
                    className={`relative w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border-blue-500/30 shadow-inner glow"
                        : "bg-slate-900/50 border-white/5"
                    }`}
                  >
                    <span
                      className={`text-3xl filter transition-all duration-300 ${
                        achievement.unlocked ? "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "grayscale"
                      }`}
                    >
                      {achievement.badgeImage}
                    </span>
                    {!achievement.unlocked && (
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                  </div>

                  {/* Detail Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-bold text-base leading-tight tracking-tight ${
                          achievement.unlocked ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {achievement.name}
                      </h3>
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 pr-2">
                      {achievement.description}
                    </p>

                    {/* Footer Unlock States */}
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Unlocked on {new Date(achievement.unlockedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
