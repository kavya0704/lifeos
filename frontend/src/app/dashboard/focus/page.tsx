"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, AlertCircle, Plus, CheckCircle, Brain, Sparkles, Award } from "lucide-react";
import { useAuth } from "@/hooks";
import { activitiesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TimerPreset = "POMODORO" | "DEEP_WORK" | "CUSTOM";
type FocusActivity = "STUDY" | "CODING" | "REVISION" | "ENGLISH_SPEAKING";

export default function FocusPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();

  // Settings states
  const [preset, setPreset] = useState<TimerPreset>("POMODORO");
  const [activity, setActivity] = useState<FocusActivity>("STUDY");
  const [customMinutes, setCustomMinutes] = useState("25");

  // Timer run states
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [distractions, setDistractions] = useState(0);

  // Modal / Complete states
  const [showCelebration, setShowCelebration] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [xpGained, setXpGained] = useState(0);
  const [savingSession, setSavingSession] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync settings with preset
  useEffect(() => {
    let mins = 25;
    if (preset === "DEEP_WORK") mins = 50;
    else if (preset === "CUSTOM") mins = parseInt(customMinutes) || 25;

    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsActive(false);
  }, [preset, customMinutes]);

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Timer ticking logic
  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, secondsLeft]);

  // Play sound synthesized via Web Audio API
  const playCompletionChime = () => {
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
      console.error("Sound synth error:", e);
    }
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    playCompletionChime();

    const durationMins = Math.ceil(totalSeconds / 60);
    setSavingSession(true);

    try {
      // Log session in ActivityLog table
      const res = await activitiesAPI.log({
        type: activity,
        duration: durationMins,
        notes: `Focus Session completed. Distractions registered: ${distractions}.`,
      });

      // XP & Unlocks
      const badges = res.data.newlyUnlocked || [];
      // Calculate XP: 1 XP per minute of focus + a 10 XP completion bonus
      const xpValue = durationMins + 10;

      setUnlockedBadges(badges);
      setXpGained(xpValue);
      setShowCelebration(true);
      
      // Refresh context (XP & Levels)
      await refreshUser();
    } catch (err) {
      console.error("Failed to save focus session:", err);
    } finally {
      setSavingSession(false);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(totalSeconds);
    setDistractions(0);
  };

  // SVG parameters for progress circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalSeconds > 0 
    ? circumference - (secondsLeft / totalSeconds) * circumference 
    : circumference;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#07090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#07090e] to-[#07090e] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent mb-2 text-center">
          Focus Session Timer
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Enter deep focus, count distractions, and accumulate productivity rewards.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md glass-card p-6">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Setup Session
              </h3>

              {/* Preset Selector */}
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-xs text-muted-foreground font-semibold">TIMER PRESET</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["POMODORO", "DEEP_WORK", "CUSTOM"] as TimerPreset[]).map((p) => (
                    <button
                      key={p}
                      disabled={isActive}
                      onClick={() => setPreset(p)}
                      className={`text-xs font-semibold py-2 px-1 rounded-xl border transition-all duration-200 ${
                        preset === p
                          ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      } disabled:opacity-50`}
                    >
                      {p === "DEEP_WORK" ? "Deep Work" : p === "POMODORO" ? "Pomodoro" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              {preset === "CUSTOM" && (
                <div className="flex flex-col gap-1.5 mb-4">
                  <span className="text-xs text-muted-foreground font-semibold">MINUTES</span>
                  <Input
                    type="number"
                    disabled={isActive}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Enter minutes"
                    className="bg-background/50 border-input rounded-xl pr-4 pl-4 focus-visible:border-primary"
                  />
                </div>
              )}

              {/* Activity Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground font-semibold">FOCUS ACTIVITY</span>
                <div className="flex flex-col gap-2">
                  {(["STUDY", "CODING", "REVISION", "ENGLISH_SPEAKING"] as FocusActivity[]).map((act) => (
                    <button
                      key={act}
                      disabled={isActive}
                      onClick={() => setActivity(act)}
                      className={`text-xs font-semibold text-left py-2.5 px-4 rounded-xl border transition-all duration-200 ${
                        activity === act
                          ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      } disabled:opacity-50`}
                    >
                      {act === "ENGLISH_SPEAKING" ? "🗣️ English Speaking" : act === "CODING" ? "💻 Coding" : act === "REVISION" ? "📚 Revision" : "📝 Study Session"}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Distraction Panel */}
            <Card className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md glass-card p-6">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Distraction Counter
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Did your mind wander? Hit the button below to register a distraction.
              </p>

              <div className="flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-3xl font-black text-rose-500">{distractions}</span>
                  <span className="text-xs text-muted-foreground block">Distractions</span>
                </div>
                <Button
                  onClick={() => setDistractions((d) => d + 1)}
                  disabled={!isActive}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 w-32 justify-center"
                >
                  <Plus className="w-4 h-4" /> Tap
                </Button>
              </div>
            </Card>
          </div>

          {/* Core Timer View */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            <Card className="rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md glass-card p-12 flex flex-col items-center justify-center w-full min-h-[400px]">
              {/* Circular Timer Progress */}
              <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Track Circle */}
                  <circle
                    cx="144"
                    cy="144"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <motion.circle
                    cx="144"
                    cy="144"
                    r={radius}
                    className="stroke-primary"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.3, ease: "linear" }}
                    strokeLinecap="round"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                    }}
                  />
                </svg>

                {/* Clock String */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-black font-mono tracking-tight text-white select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1 select-none">
                    {isActive ? "Focusing" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Timer Action Controls */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-white/10 hover:bg-white/10 text-white"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>

                <Button
                  onClick={toggleTimer}
                  className={`w-16 h-16 rounded-full font-bold flex items-center justify-center glow ${
                    isActive
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20"
                      : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
                  }`}
                >
                  {isActive ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                </Button>

                {/* Force complete button */}
                <Button
                  onClick={handleTimerComplete}
                  disabled={!isActive && secondsLeft === totalSeconds || savingSession}
                  className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 flex items-center justify-center"
                >
                  {savingSession ? (
                    <span className="animate-spin text-emerald-400 font-bold">...</span>
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Celebration Overlay Modal */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-[#0a0f1d] border border-blue-500/30 p-8 rounded-3xl glow-card text-center relative overflow-hidden"
              >
                <div className="absolute -left-12 -top-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 glow">
                  <CheckCircle className="w-10 h-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent mb-2">
                  Session Completed!
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fantastic job staying focused. Your metrics have been synced with your AI Coach.
                </p>

                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
                  <div>
                    <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                      XP Awarded
                    </span>
                    <span className="text-2xl font-black text-blue-400 mt-1 block flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-400" /> +{xpGained}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                      Distractions
                    </span>
                    <span className="text-2xl font-black text-rose-500 mt-1 block">
                      {distractions}
                    </span>
                  </div>
                </div>

                {/* Unlocked Achievements list */}
                {unlockedBadges.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-3 flex items-center justify-center gap-1.5">
                      <Award className="w-4 h-4" /> Achievement Unlocked!
                    </span>
                    <div className="flex flex-col gap-2">
                      {unlockedBadges.map((badge, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-left"
                        >
                          <span className="text-2xl">🔥</span>
                          <div>
                            <h4 className="font-bold text-sm text-white">{badge}</h4>
                            <p className="text-[10px] text-muted-foreground">Badge unlocked & bonus XP awarded!</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setShowCelebration(false)}
                  className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold py-3 glow"
                >
                  Back to Dashboard
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
