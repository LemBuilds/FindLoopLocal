"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm",
            "bg-[var(--color-surface)] border border-[var(--color-border)]",
            "text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]",
            "focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
            "transition-colors duration-[var(--duration-fast)]",
            error ? "border-[var(--color-destructive)]" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
