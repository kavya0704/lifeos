import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — LifeOS",
  description: "Sign in to your LifeOS account to access your personal AI-powered dashboard.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
