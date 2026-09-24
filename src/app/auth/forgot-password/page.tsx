"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/auth/login" title="Reset password" />
      <div className="max-w-sm mx-auto px-4 pt-8">
        {sent ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📧</p>
            <h2 className="font-bold text-lg mb-2" style={{ color: "var(--color-text)" }}>Email sent</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Check your inbox for a password reset link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Enter your email and we&apos;ll send a reset link.
            </p>
            {error && (
              <div className="px-4 py-3 rounded-[var(--radius-sm)] text-sm" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }} role="alert">
                {error}
              </div>
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>Send reset link</Button>
          </form>
        )}
      </div>
    </div>
  );
}
