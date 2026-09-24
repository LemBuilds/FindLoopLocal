"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    window.location.href = "/feed";
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/auth/login" title="Choose a new password" />
      <div className="max-w-sm mx-auto px-4 pt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-[var(--radius-sm)] text-sm" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }} role="alert">
              {error}
            </div>
          )}
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>Update password</Button>
        </form>
      </div>
    </div>
  );
}
