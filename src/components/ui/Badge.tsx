import type React from "react";

interface BadgeProps {
  label: string;
  variant?: "found" | "lost" | "accent" | "muted";
}

const STYLES: Record<NonNullable<BadgeProps["variant"]>, React.CSSProperties> = {
  found:  { background: "var(--ok)",      color: "white" },
  lost:   { background: "var(--danger)",  color: "white" },
  accent: { background: "var(--accent)",  color: "white" },
  muted:  { background: "var(--surface2)", color: "var(--ink3)" },
};

export function Badge({ label, variant = "muted" }: BadgeProps) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 99,
      fontSize: 10, fontWeight: 700,
      letterSpacing: .5, textTransform: "uppercase" as const,
      ...STYLES[variant],
    }}>
      {label}
    </span>
  );
}
