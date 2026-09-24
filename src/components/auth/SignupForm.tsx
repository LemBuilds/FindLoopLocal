"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CONSENT_VERSION } from "@/lib/gdpr";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError("You must accept the privacy policy to continue."); return; }
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      window.location.href = "/feed";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div
          className="px-4 py-3 rounded-[var(--radius-sm)] text-sm"
          style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)", border: "1px solid rgba(229,85,85,0.2)" }}
          role="alert"
        >
          {error}
        </div>
      )}

      <Input
        label="Full name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
        required
        placeholder="Jane Smith"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        placeholder="you@example.com"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Min 8 characters"
        hint="At least 8 characters"
      />

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent)]"
          required
        />
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          I agree to the{" "}
          <Link href="/privacy" className="underline" style={{ color: "var(--color-accent)" }}>Privacy Policy</Link>
          {" "}and{" "}
          <Link href="/terms" className="underline" style={{ color: "var(--color-accent)" }}>Terms of Service</Link>.
          FindLoop processes your data under GDPR — consent v{CONSENT_VERSION}.
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Create account
      </Button>

      <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium" style={{ color: "var(--color-accent)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
