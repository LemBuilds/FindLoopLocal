"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface VerifyFormProps {
  currentPhone: string | null;
  nextPath: string;
  isChangingPhone?: boolean;
}

export function VerifyForm({ currentPhone, nextPath, isChangingPhone }: VerifyFormProps) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/profile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await r.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      window.location.href = nextPath;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        className="px-4 py-3 rounded-[var(--radius-sm)] text-sm"
        style={{ background: "var(--color-found-bg)", color: "var(--color-found)" }}
      >
        Your number is kept private and never shown on your listings.
      </div>

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
        label="Phone number"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 555 000 0000"
        autoComplete="tel"
        required
        hint={isChangingPhone ? "Saving a new number will mark your account as unverified until confirmed." : undefined}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        {isChangingPhone ? "Save & re-verify" : "Verify account"}
      </Button>
    </form>
  );
}
