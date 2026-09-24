import { Suspense } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in — FindLoop" };

export default function LoginPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/" />
      <div className="max-w-sm mx-auto px-4 pt-8 pb-16">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)" }}>Welcome back</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>Sign in to your FindLoop account</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
