"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Calendar,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Life Coach",
    description: "Personal AI that learns your habits, strengths, and goals to provide tailored coaching.",
  },
  {
    icon: Calendar,
    title: "Smart Daily Planner",
    description: "Auto-generated daily schedules optimized around your productivity patterns.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Track daily, weekly, monthly, and yearly goals with intelligent progress analysis.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visual charts for productivity, habits, study trends, and performance metrics.",
  },
  {
    icon: Zap,
    title: "Focus Mode",
    description: "Pomodoro timer and deep work sessions with distraction tracking and analytics.",
  },
  {
    icon: Sparkles,
    title: "Gamification",
    description: "XP, levels, achievements, and streaks that turn self-improvement into a game.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full gradient-primary opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full gradient-accent opacity-15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium glass-card text-primary mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Life Management
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6"
          >
            Your Personal{" "}
            <span className="gradient-text">AI Chief of Staff</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            LifeOS combines smart habit tracking, AI coaching, intelligent scheduling,
            and performance analytics into one platform that helps you become your best self.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg rounded-xl glow hover:scale-105 transition-transform duration-200">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-xl glass-card hover:scale-105 transition-transform duration-200"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Level Up</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powered by AI that learns your behavior and adapts to help you achieve more.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="group p-6 rounded-2xl glass-card hover:scale-[1.02] transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold">LifeOS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LifeOS. Built with AI.
          </p>
        </div>
      </footer>
    </main>
  );
}
