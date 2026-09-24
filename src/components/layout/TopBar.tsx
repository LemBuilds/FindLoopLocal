"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopBarProps {
  title?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, backHref, action }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 h-14"
      style={{
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-muted)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        ) : (
          <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: "var(--color-accent)" }}>
            FindLoop
          </Link>
        )}
        {title && (
          <h1 className="font-semibold text-base truncate" style={{ color: "var(--color-text)" }}>
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-1">
        {action}
        <ThemeToggle />
      </div>
    </header>
  );
}
