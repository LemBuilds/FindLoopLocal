"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, charCount, maxChars, className = "", id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm resize-none",
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
        <div className="flex justify-between items-center">
          {error ? (
            <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
              {error}
            </p>
          ) : hint ? (
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {hint}
            </p>
          ) : (
            <span />
          )}
          {maxChars !== undefined && charCount !== undefined && (
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {charCount}/{maxChars}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
