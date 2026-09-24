"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitClaim } from "@/actions/claims";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUploader, type UploadedPhoto } from "@/components/post/PhotoUploader";

interface ClaimFormProps {
  listingId: string;
  listingTitle: string;
}

export function ClaimForm({ listingId, listingTitle }: ClaimFormProps) {
  const router = useRouter();
  const [details, setDetails] = useState("");
  const [proofPhotos, setProofPhotos] = useState<UploadedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (details.trim().length < 20) { setError("Please provide at least 20 characters of identifying details."); return; }
    setError(null);
    setLoading(true);

    const result = await submitClaim({
      listing_id: listingId,
      identifying_details: details.trim(),
      proof_photo: proofPhotos[0]
        ? { name: proofPhotos[0].file.name, dataUrl: proofPhotos[0].dataUrl }
        : undefined,
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/listings/${listingId}?claimed=1`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="px-4 py-3 rounded-[var(--radius-md)]" style={{ background: "var(--color-surface-muted)" }}>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Claiming:</p>
        <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{listingTitle}</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-[var(--radius-sm)] text-sm" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }} role="alert">
          {error}
        </div>
      )}

      <div>
        <Textarea
          label="Identifying details *"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
          placeholder="Describe something only the real owner would know: serial number, unique scratches, what's inside, a sticker, etc."
          minLength={20}
          maxLength={600}
          charCount={details.length}
          maxChars={600}
          hint="Min 20 characters · Only shared with the finder. Deleted if claim expires."
        />
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "var(--color-text-secondary)" }}>
          Proof photo <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>(optional)</span>
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
          Receipt, box photo, or screenshot of purchase. You can blur sensitive areas.
        </p>
        <PhotoUploader
          photos={proofPhotos.slice(0, 1)}
          onChange={(p) => setProofPhotos(p)}
        />
      </div>

      <div className="px-3 py-2 rounded-[var(--radius-sm)] text-xs" style={{ background: "var(--color-found-bg)", color: "var(--color-found)" }}>
        🔒 Your response is private — only the finder sees it. Deleted if claim expires. Max 3 claim attempts per listing.
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Submit claim
      </Button>
      <p className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>
        Finder has 48 hours to respond
      </p>
    </form>
  );
}
