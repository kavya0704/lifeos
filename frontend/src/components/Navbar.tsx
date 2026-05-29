"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Brain, LogOut, Sparkles, LayoutDashboard, TrendingUp, Timer, Award } from "lucide-react";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LifeOS</span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 transition-colors ${
                  pathname === "/dashboard"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-1.5 transition-colors ${
                  pathname === "/dashboard/analytics"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Analytics</span>
              </Link>
              <Link
                href="/dashboard/focus"
                className={`flex items-center gap-1.5 transition-colors ${
                  pathname === "/dashboard/focus"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Timer className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Focus</span>
              </Link>
              <Link
                href="/dashboard/achievements"
                className={`flex items-center gap-1.5 transition-colors ${
                  pathname === "/dashboard/achievements"
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Award className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Achievements</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Navigation & User controls */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{user.name}</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-xl flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

