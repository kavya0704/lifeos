import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — LifeOS",
  description: "Create your LifeOS account and start managing your life with AI.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
