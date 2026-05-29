"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Clock,
  BookOpen,
  Dumbbell,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Languages,
  Loader2,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/hooks";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const POPULAR_SUBJECTS = ["DSA", "System Design", "English Speaking", "Machine Learning", "React", "TypeScript", "Database Systems"];

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Onboarding Form State
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [englishLevel, setEnglishLevel] = useState("Intermediate");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [gymSchedule, setGymSchedule] = useState<string[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [weakAreaInput, setWeakAreaInput] = useState("");
  const [strongAreas, setStrongAreas] = useState<string[]>([]);
  const [strongAreaInput, setStrongAreaInput] = useState("");

  // Helpers for tags
  const addTag = (list: string[], setList: (val: string[]) => void, tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeTag = (list: string[], setList: (val: string[]) => void, tag: string) => {
    setList(list.filter((t) => t !== tag));
  };

  const toggleGymDay = (day: string) => {
    if (gymSchedule.includes(day)) {
      setGymSchedule(gymSchedule.filter((d) => d !== day));
    } else {
      setGymSchedule([...gymSchedule, day]);
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 2 && subjects.length === 0) {
      setError("Please add at least one study subject.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        wakeTime,
        sleepTime,
        englishLevel,
        subjects,
        gymSchedule,
        weakAreas,
        strongAreas,
      };

      const { data } = await authAPI.updateProfile(payload);
      // Save updated user preferences locally
      localStorage.setItem("lifeos_user", JSON.stringify(data.user));
      await refreshUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Onboarding failed:", err);
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background text-foreground">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full gradient-primary opacity-10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full gradient-accent opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Logo and Progress */}
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto glow">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configure Your LifeOS</h1>
            <p className="text-muted-foreground text-sm mt-1">Let AI personalize your daily planning and coaching</p>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <Card className="glass-card border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Daily Rhythm */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      1. What is your daily rhythm?
                    </h2>
                    <p className="text-muted-foreground text-sm">AI maps out schedules starting from your waking hour until sleep.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Wake Up Time</label>
                      <Input
                        type="time"
                        value={wakeTime}
                        onChange={(e) => setWakeTime(e.target.value)}
                        className="rounded-xl py-6 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sleep Time</label>
                      <Input
                        type="time"
                        value={sleepTime}
                        onChange={(e) => setSleepTime(e.target.value)}
                        className="rounded-xl py-6 text-lg"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Study Focus */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      2. What are you studying?
                    </h2>
                    <p className="text-muted-foreground text-sm">Add the subjects or languages you are focusing on right now.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Subject Focus</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. System Design, Calculus"
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(subjects, setSubjects, subjectInput), setSubjectInput(""))}
                        />
                        <Button type="button" onClick={() => (addTag(subjects, setSubjects, subjectInput), setSubjectInput(""))}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Popular subjects recommendation */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground font-medium">Popular Subjects:</span>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SUBJECTS.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => addTag(subjects, setSubjects, sub)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-primary/10 transition-colors"
                          >
                            + {sub}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subjects tags list */}
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {subjects.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-primary text-white text-sm"
                          >
                            {sub}
                            <button type="button" onClick={() => removeTag(subjects, setSubjects, sub)}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Languages className="w-4 h-4 text-primary" />
                        English Fluency Level
                      </label>
                      <select
                        value={englishLevel}
                        onChange={(e) => setEnglishLevel(e.target.value)}
                        className="w-full p-3 rounded-xl border border-input bg-background text-sm"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Native">Native</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Gym & Habit Mapping */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      3. Gym Schedule
                    </h2>
                    <p className="text-muted-foreground text-sm">Select the days of the week you plan to hit the gym.</p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-sm font-medium">Workout Days:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {WEEKDAYS.map((day) => {
                        const active = gymSchedule.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleGymDay(day)}
                            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                              active
                                ? "gradient-primary text-white border-transparent glow scale-95"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Strengths & Weaknesses */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      4. What are your focus areas?
                    </h2>
                    <p className="text-muted-foreground text-sm">Identify strengths and areas needing practice to help AI generate smart tasks.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Strong Areas */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Strong Areas / Skills</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Coding, Time Management"
                          value={strongAreaInput}
                          onChange={(e) => setStrongAreaInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(strongAreas, setStrongAreas, strongAreaInput), setStrongAreaInput(""))}
                        />
                        <Button type="button" onClick={() => (addTag(strongAreas, setStrongAreas, strongAreaInput), setStrongAreaInput(""))}>
                          Add
                        </Button>
                      </div>
                      {strongAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {strongAreas.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-sm"
                            >
                              {skill}
                              <button type="button" onClick={() => removeTag(strongAreas, setStrongAreas, skill)}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weak Areas */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Areas to Improve</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. English speaking, Math"
                          value={weakAreaInput}
                          onChange={(e) => setWeakAreaInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(weakAreas, setWeakAreas, weakAreaInput), setWeakAreaInput(""))}
                        />
                        <Button type="button" onClick={() => (addTag(weakAreas, setWeakAreas, weakAreaInput), setWeakAreaInput(""))}>
                          Add
                        </Button>
                      </div>
                      {weakAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {weakAreas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 text-sm"
                            >
                              {area}
                              <button type="button" onClick={() => removeTag(weakAreas, setWeakAreas, area)}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="rounded-xl px-5 py-5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button onClick={handleNext} className="gradient-primary text-white rounded-xl px-6 py-5 glow">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="gradient-primary text-white rounded-xl px-6 py-5 glow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Saving Setup..." : "Finish Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
