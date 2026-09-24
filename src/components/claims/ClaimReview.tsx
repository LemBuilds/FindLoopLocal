"use client";

import { useState } from "react";
import Image from "next/image";
import { respondToClaim } from "@/actions/claims";
import type { Claim } from "@/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface ClaimReviewProps {
  claim: Claim;
  storageBase: string;
}

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

export function ClaimReview({ claim, storageBase }: ClaimReviewProps) {
  const [loading, setLoading] = useState(false);
  const [finderNote, setFinderNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [result, setResult] = useState<"accepted" | "rejected" | null>(null);

  async function handleRespond(action: "accept" | "reject") {
    setLoading(true);
    const res = await respondToClaim({ claim_id: claim.id, action, finder_note: finderNote || undefined });
    if ("error" in res) { alert(res.error); setLoading(false); return; }
    setResult(action === "accept" ? "accepted" : "rejected");
    setLoading(false);
  }

  if (result === "accepted") {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="font-bold text-lg mb-2" style={{ color: "var(--color-text)" }}>Claim accepted!</h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Contact details have been revealed. Coordinate the return below.</p>
      </div>
    );
  }

  if (result === "rejected") {
    return (
      <div className="text-center py-6">
        <p className="text-3xl mb-3">❌</p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Claim rejected. The queue advances to the next claimant.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4" style={{ background: "var(--color-surface)" }}>
      {/* Claimant info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "var(--color-accent)" }}>
          {claim.profiles?.full_name?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{claim.profiles?.full_name ?? "Anonymous"}</p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Queue position #{claim.queue_position} · {timeLeft(claim.expires_at)}
          </p>
        </div>
      </div>

      {/* Their description */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>Their identifying details</p>
        <div className="px-3 py-2 rounded-[var(--radius-sm)] text-sm leading-relaxed" style={{ background: "var(--color-surface-muted)" }}>
          {claim.identifying_details}
        </div>
      </div>

      {/* Proof photo */}
      {claim.proof_photo_path && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>Proof photo</p>
          <div className="relative w-full h-40 rounded-[var(--radius-sm)] overflow-hidden">
            <Image
              src={`${storageBase}/${claim.proof_photo_path}`}
              alt="Proof photo"
              fill
              className="object-contain"
              style={{ background: "var(--color-surface-muted)" }}
            />
          </div>
        </div>
      )}

      {/* Reject note toggle */}
      {showNoteField && (
        <Textarea
          label="Note to claimant (optional)"
          value={finderNote}
          onChange={(e) => setFinderNote(e.target.value)}
          rows={2}
          placeholder="e.g. Details don't match. Please try again with more specific info."
          maxLength={200}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="found"
          size="md"
          fullWidth
          loading={loading}
          onClick={() => handleRespond("accept")}
        >
          Accept — arrange return
        </Button>
        <Button
          variant="secondary"
          size="md"
          loading={loading}
          onClick={() => {
            if (!showNoteField) { setShowNoteField(true); return; }
            handleRespond("reject");
          }}
        >
          {showNoteField ? "Confirm reject" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
