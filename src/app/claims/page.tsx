import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { ClaimReview } from "@/components/claims/ClaimReview";
import { CLAIM_PROOFS_BUCKET } from "@/lib/storage";
import type { Claim } from "@/types";

const PROOF_URL_TTL_SECONDS = 60 * 60;

export const metadata = { title: "Claims — FindLoop" };

export default async function ClaimsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Claims on finder's listings (finder reviewing)
  const { data: incomingClaims } = await supabase
    .from("claims")
    .select(`
      *,
      profiles:claimant_id(full_name, avatar_url, created_at),
      listing:listings!inner(title, category, user_id)
    `)
    .eq("listing.user_id", user.id)
    .eq("status", "pending")
    .order("queue_position", { ascending: true })
    .limit(20);

  // Claims submitted by this user (claimant view)
  const { data: myClaims } = await supabase
    .from("claims")
    .select("*, listing:listing_id(title)")
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const claims = (incomingClaims ?? []) as Claim[];
  const userClaims = (myClaims ?? []) as Claim[];

  // Proof photos live in a private bucket — hand the finder short-lived signed URLs.
  const proofPaths = claims.map((c) => c.proof_photo_path).filter((p): p is string => !!p);
  const proofUrls = new Map<string, string>();
  if (proofPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(CLAIM_PROOFS_BUCKET)
      .createSignedUrls(proofPaths, PROOF_URL_TTL_SECONDS);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) proofUrls.set(s.path, s.signedUrl);
    }
  }

  return (
    <PageShell title="Claims">
      {claims.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>
            Pending claims on your listings
          </h2>
          <div className="flex flex-col gap-3">
            {claims.map((claim) => (
              <div key={claim.id}>
                <p className="text-xs mb-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  For: <Link href={`/listings/${claim.listing_id}`} className="underline">{claim.listing?.title}</Link>
                </p>
                <ClaimReview
                  claim={claim}
                  proofPhotoUrl={claim.proof_photo_path ? proofUrls.get(claim.proof_photo_path) ?? null : null}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {userClaims.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>Your submitted claims</h2>
          <div className="flex flex-col gap-2">
            {userClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)]" style={{ background: "var(--color-surface)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{claim.listing?.title ?? "Unknown listing"}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {claim.status === "pending" ? `Pending · expires ${new Date(claim.expires_at).toLocaleDateString()}` : claim.status}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  claim.status === "accepted" ? "bg-[var(--color-found-bg)] text-[var(--color-found)]" :
                  claim.status === "rejected" ? "bg-[rgba(229,85,85,0.08)] text-[var(--color-destructive)]" :
                  claim.status === "expired" ? "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]" :
                  "bg-[var(--color-accent-bg)] text-[var(--color-accent)]"
                }`}>
                  {claim.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {claims.length === 0 && userClaims.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold" style={{ color: "var(--color-text)" }}>No claims yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Claims appear here when someone says a found item is theirs.</p>
        </div>
      )}
    </PageShell>
  );
}
