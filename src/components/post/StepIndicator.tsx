interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 mb-6" role="list" aria-label="Form steps">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-1 flex-1" role="listitem">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors duration-[var(--duration-fast)]"
              style={{
                background: done
                  ? "var(--color-found)"
                  : active
                  ? "var(--color-accent)"
                  : "var(--color-surface-muted)",
                color: done || active ? "#fff" : "var(--color-text-secondary)",
              }}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-colors duration-[var(--duration-fast)]"
                style={{ background: done ? "var(--color-found)" : "var(--color-border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
