import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Dashboard — LifeOS",
  description: "Your personal AI-powered dashboard. Track habits, manage goals, and optimize your daily schedule.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-background">{children}</div>
    </div>
  );
}
