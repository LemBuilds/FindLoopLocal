interface PrivacyWarningProps {
  onContinue: () => void;
  onCancel: () => void;
}

export function PrivacyWarning({ onContinue, onCancel }: PrivacyWarningProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border p-4"
      style={{ background: "var(--color-accent-bg)", borderColor: "rgba(244,164,74,0.3)" }}
      role="dialog"
      aria-label="Privacy reminder"
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0" aria-hidden>⚠️</span>
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
            Before you upload photos
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Do not include photos that show your face, home address, ID documents, or vehicle registration plates.
            FindLoop blurs your location — please do the same with your photos.
          </p>
        </div>
      </div>

      <ul className="text-xs space-y-1 mb-4" style={{ color: "var(--color-text-secondary)" }}>
        <li>✅ Item close-up only</li>
        <li>✅ Neutral background preferred</li>
        <li>❌ No faces or people</li>
        <li>❌ No visible addresses or documents</li>
        <li>❌ No vehicle registration plates</li>
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 py-2 rounded-[var(--radius-sm)] text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "var(--color-text)" }}
        >
          I understand, continue
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-colors hover:bg-[var(--color-surface-muted)]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
