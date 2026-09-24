"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import type { Listing, ListingPhoto } from "@/types";

/* ─── helpers ─────────────────────────────────────────────── */

const CATEGORY_LABEL: Record<string, string> = {
  phones: "Phones", wallets: "Wallets", bags: "Bags", jewelry: "Jewelry",
  documents: "Documents", electronics: "Electronics", pets: "Pets", other: "Other",
};
const CATEGORY_EMOJI: Record<string, string> = {
  phones: "📱", wallets: "👛", bags: "🎒", jewelry: "💍",
  documents: "📄", electronics: "🎧", pets: "🐾", other: "📦",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return fmtDate(iso);
}

/* ─── Detail table row ────────────────────────────────────── */

function Row({ label, value, accent, full }: {
  label: string; value: React.ReactNode; accent?: boolean; full?: boolean;
}) {
  return (
    <div style={{ display: full ? "block" : "flex", borderBottom: "1px solid var(--bdr)", padding: "13px 0" }}>
      <div style={{
        width: full ? "auto" : 148, flexShrink: 0,
        fontSize: 11.5, fontWeight: 700, color: "var(--ink4)",
        textTransform: "uppercase", letterSpacing: .6,
        marginBottom: full ? 8 : 0, paddingTop: 2,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: accent ? "var(--accent)" : "var(--ink)", fontWeight: accent ? 700 : 400, lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

/* ─── Star rating picker ──────────────────────────────────── */

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            fontSize: 28, lineHeight: 1,
            color: n <= (hover || value) ? "#F4A623" : "var(--bdr2)",
            transition: "color .12s, transform .12s",
            transform: n <= (hover || value) ? "scale(1.15)" : "scale(1)",
          }}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >★</button>
      ))}
    </div>
  );
}

/* ─── Review card ─────────────────────────────────────────── */

interface ReviewRow {
  id: string; listing_id: string; reviewer_id: string;
  reviewer_name: string; rating: number; comment: string; created_at: string;
}

function ReviewCard({ review }: { review: ReviewRow }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--bdr)",
      borderRadius: 14, padding: "18px 20px", boxShadow: "var(--sh-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {review.reviewer_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{review.reviewer_name}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{timeAgo(review.created_at)}</div>
          </div>
        </div>
        {/* Stars (display only) */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} style={{ fontSize: 15, color: n <= review.rating ? "#F4A623" : "var(--bdr2)" }}>★</span>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.7, margin: 0 }}>{review.comment}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();

  const [listing, setListing]         = useState<Listing | null>(null);
  const [photos, setPhotos]           = useState<ListingPhoto[]>([]);
  const [viewCount, setViewCount]     = useState(0);
  const [userId, setUserId]           = useState<string | null>(null);
  const [reviews, setReviews]         = useState<ReviewRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  /* mark-returned state */
  const [marking, setMarking]         = useState(false);

  /* review form state */
  const [rating, setRating]           = useState(0);
  const [comment, setComment]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted]     = useState(false);

  function loadReviews() {
    fetch(`/api/local/reviews?listing_id=${id}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/local/listings/${id}`).then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch("/api/local/auth/user").then(r => r.json()),
    ]).then(([data, auth]) => {
      if (data) {
        setListing(data.listing as Listing);
        setPhotos(data.photos as ListingPhoto[]);
        setViewCount(data.viewCount as number);
        fetch("/api/local/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: id }),
        }).catch(() => {});
      }
      setUserId(auth?.user?.id ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
    loadReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleMarkReturned() {
    if (!listing) return;
    setMarking(true);
    const res = await fetch(`/api/local/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "recovered" }),
    });
    if (res.ok) {
      const data = await res.json();
      setListing(data.listing as Listing);
    }
    setMarking(false);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setSubmitError("Please select a star rating."); return; }
    if (!comment.trim()) { setSubmitError("Please write a short review."); return; }
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/local/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: id, rating, comment }),
    });
    if (res.ok) {
      setSubmitted(true);
      loadReviews();
    } else {
      const d = await res.json();
      setSubmitError(d.error ?? "Something went wrong.");
    }
    setSubmitting(false);
  }

  /* ── derived ── */
  const isOwner      = !!userId && userId === (listing?.user_id ?? "");
  const isFound      = listing?.type === "found";
  const canClaim     = isFound && !!userId && !isOwner && listing?.status === "active";
  const isRecovered  = listing?.status === "recovered";
  const hasReviewed  = !!userId && reviews.some(r => r.reviewer_id === userId);
  const canReview    = isRecovered && !!userId && !hasReviewed;
  const photoSrc     = photos.length > 0 ? `/uploads/${photos[0].storage_path}` : null;
  const isDemo       = listing?.user_id === "demo-system";
  const typeColor    = listing?.type === "lost" ? "var(--danger)" : "var(--ok)";
  const typeBg       = listing?.type === "lost" ? "var(--danger-bg)" : "var(--ok-bg)";
  const typeBdr      = listing?.type === "lost" ? "var(--danger-bdr)" : "var(--ok-bdr)";
  const avgRating    = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <NavBar />
        <div style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ color: "var(--ink3)" }}>Loading listing…</p>
        </div>
      </div>
    );
  }
  if (notFound || !listing) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <NavBar />
        <div style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔍</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Listing not found</h1>
          <p style={{ color: "var(--ink3)", marginBottom: 24 }}>This listing may have been removed or never existed.</p>
          <Link href="/feed" style={{ display: "inline-block", padding: "10px 24px", background: "var(--accent)", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Back to listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <NavBar />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 100px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 13, color: "var(--ink4)" }}>
          <Link href="/feed" style={{ color: "var(--ink3)", fontWeight: 500 }}>Browse</Link>
          <span>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{listing.title}</span>
        </nav>

        {/* ── Photo hero ── */}
        <div style={{ height: 340, borderRadius: 20, overflow: "hidden", position: "relative", background: "var(--surface2)", marginBottom: 28, boxShadow: "var(--sh-md)" }}>
          {photoSrc ? (
            <Image src={photoSrc} alt={listing.title} fill priority sizes="760px" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>
              {CATEGORY_EMOJI[listing.category]}
            </div>
          )}
          {/* Badges */}
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
            <span style={{
              padding: "5px 14px", borderRadius: 99, fontSize: 11.5, fontWeight: 800, color: "white",
              background: typeColor, letterSpacing: .5, textTransform: "uppercase", boxShadow: "0 2px 8px rgba(0,0,0,.25)",
            }}>{listing.type}</span>
            {listing.status !== "active" && (
              <span style={{
                padding: "5px 14px", borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                background: isRecovered ? "rgba(39,174,96,.85)" : "rgba(0,0,0,.55)",
                color: "white", backdropFilter: "blur(4px)", textTransform: "capitalize",
              }}>
                {isRecovered ? "✓ Returned" : listing.status}
              </span>
            )}
          </div>
          {/* Views */}
          <div style={{
            position: "absolute", bottom: 14, right: 14, padding: "4px 10px", borderRadius: 99,
            background: "rgba(0,0,0,.55)", color: "rgba(255,255,255,.80)",
            backdropFilter: "blur(4px)", fontSize: 12, fontWeight: 500,
          }}>
            👁 {viewCount} view{viewCount !== 1 ? "s" : ""}
          </div>
          {/* Avg rating badge */}
          {avgRating && (
            <div style={{
              position: "absolute", bottom: 14, left: 16, padding: "4px 10px", borderRadius: 99,
              background: "rgba(0,0,0,.55)", color: "#F4A623",
              backdropFilter: "blur(4px)", fontSize: 12, fontWeight: 700,
            }}>
              ★ {avgRating} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* LEFT: detail table */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: -.5, lineHeight: 1.25, marginBottom: 6 }}>
              {listing.title}
            </h1>
            <p style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 24 }}>Listed {timeAgo(listing.created_at)}</p>

            {/* Detail table */}
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--bdr)", padding: "0 20px", boxShadow: "var(--sh-sm)", marginBottom: 28 }}>
              <Row label="Report type" value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 99, fontSize: 13, fontWeight: 700, color: typeColor, background: typeBg, border: `1px solid ${typeBdr}` }}>
                  {listing.type === "lost" ? "😔 Lost" : "🤝 Found"}
                </span>
              } />
              <Row label="Category" value={`${CATEGORY_EMOJI[listing.category]} ${CATEGORY_LABEL[listing.category] ?? listing.category}`} />
              <Row label="Status" value={
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12.5, fontWeight: 700,
                  color: isRecovered ? "var(--ok)" : listing.status === "active" ? "var(--ok)" : "var(--ink3)",
                  background: listing.status === "active" || isRecovered ? "var(--ok-bg)" : "var(--surface2)",
                  border: `1px solid ${listing.status === "active" || isRecovered ? "var(--ok-bdr)" : "var(--bdr)"}`,
                }}>
                  {isRecovered ? "✓ Returned" : listing.status === "active" ? "✓ Active" : "Closed"}
                </span>
              } />
              <Row label="Date" value={fmtDate(listing.date_occurred)} />
              {listing.time_occurred && <Row label="Time" value={listing.time_occurred} />}
              <Row label={listing.type === "lost" ? "Last seen" : "Where found"} value={`📍 ${listing.location_label}`} />
              {listing.reward_amount && listing.reward_amount > 0
                ? <Row label="Reward" accent value={`💰 ${listing.reward_currency ?? "£"}${listing.reward_amount} offered`} />
                : <Row label="Reward" value={<span style={{ color: "var(--ink4)" }}>None offered</span>} />
              }
              <Row label="Contact via" value={listing.contact_preference === "in_app" ? "In-app message" : "Email"} />
              {listing.is_anonymous
                ? <Row label="Posted by" value={<span style={{ color: "var(--ink4)" }}>Anonymous</span>} />
                : !isDemo && <Row label="Posted by" value="Community member" />
              }
              <Row label="Listed on" value={fmtDate(listing.created_at)} />
              <Row label="Description" full value={
                <p style={{ margin: 0, fontSize: 14, color: "var(--ink2)", lineHeight: 1.75 }}>{listing.description}</p>
              } />
            </div>

            {/* ── Review form ─────────────────────────────── */}
            {isRecovered && (
              <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--bdr)", padding: 24, boxShadow: "var(--sh-sm)", marginBottom: 24 }}>

                {/* Section heading */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ok-bg)", border: "1px solid var(--ok-bdr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    ⭐
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Community reviews</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink3)" }}>
                      {reviews.length === 0 ? "Be the first to leave a review" : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}${avgRating ? ` · ★ ${avgRating} avg` : ""}`}
                    </div>
                  </div>
                </div>

                {/* Review form — only for signed-in, non-reviewer */}
                {canReview && !submitted && (
                  <form onSubmit={handleSubmitReview} style={{ marginBottom: reviews.length > 0 ? 24 : 0 }}>
                    <div style={{ padding: 18, borderRadius: 12, background: "var(--accent-bg)", border: "1px solid var(--accent-bdr)", marginBottom: 16 }}>
                      <p style={{ fontSize: 13.5, color: "var(--ink2)", fontWeight: 600, marginBottom: 14 }}>
                        How did the handover go? Share your experience.
                      </p>
                      <StarPicker value={rating} onChange={setRating} />
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink4)", height: 16 }}>
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very good"}
                        {rating === 5 && "Excellent!"}
                      </div>
                    </div>

                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Write about how the return went, the finder's helpfulness, communication…"
                      rows={4}
                      maxLength={500}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 12,
                        border: "1.5px solid var(--bdr2)", background: "var(--bg)",
                        fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6,
                        resize: "vertical", outline: "none", boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11.5, color: "var(--ink4)" }}>{comment.length}/500</span>
                      {submitError && <span style={{ fontSize: 12, color: "var(--danger)" }}>{submitError}</span>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        marginTop: 14, width: "100%", padding: "12px",
                        background: submitting ? "var(--surface3)" : "var(--accent)",
                        color: submitting ? "var(--ink3)" : "white",
                        border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
                        cursor: submitting ? "not-allowed" : "pointer",
                        transition: "background .15s",
                      }}
                    >
                      {submitting ? "Submitting…" : "Submit review"}
                    </button>
                  </form>
                )}

                {/* Submitted confirmation */}
                {submitted && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--ok-bg)", border: "1px solid var(--ok-bdr)", marginBottom: reviews.length > 0 ? 20 : 0 }}>
                    <p style={{ fontSize: 13.5, color: "var(--ok)", fontWeight: 600, margin: 0 }}>✓ Review submitted — thank you!</p>
                  </div>
                )}

                {/* Not signed in prompt */}
                {isRecovered && !userId && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--bdr)", marginBottom: reviews.length > 0 ? 20 : 0 }}>
                    <p style={{ fontSize: 13.5, color: "var(--ink3)", margin: "0 0 10px" }}>Sign in to leave a review.</p>
                    <Link href={`/auth/login?redirect=/listings/${id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Sign in →</Link>
                  </div>
                )}

                {/* Already reviewed */}
                {hasReviewed && !submitted && (
                  <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--bdr)", marginBottom: reviews.length > 0 ? 20 : 0 }}>
                    <p style={{ fontSize: 13, color: "var(--ink3)", margin: 0 }}>You've already reviewed this listing.</p>
                  </div>
                )}

                {/* Existing reviews list */}
                {reviews.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: actions panel */}
          <div style={{ flex: "0 0 240px", minWidth: 220 }}>
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--bdr)", padding: 20, boxShadow: "var(--sh-sm)", display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Returned banner */}
              {isRecovered && (
                <div style={{ textAlign: "center", padding: "14px 12px", borderRadius: 12, background: "var(--ok-bg)", border: "1px solid var(--ok-bdr)" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)" }}>Item returned!</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>This listing is now closed.</div>
                </div>
              )}

              {!isRecovered && (
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                  {isFound ? "Is this yours?" : "Did you find this?"}
                </p>
              )}

              {/* Sign in to claim */}
              {!userId && isFound && listing.status === "active" && (
                <Link href={`/auth/login?redirect=/listings/${id}`} style={{ display: "block", textAlign: "center", padding: "12px", background: "var(--accent)", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
                  Sign in to claim →
                </Link>
              )}

              {/* Claim CTA */}
              {canClaim && (
                <Link href={`/listings/${id}/claim`} style={{ display: "block", textAlign: "center", padding: "12px", background: "var(--accent)", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
                  This is mine →
                </Link>
              )}

              {/* Owner actions */}
              {isOwner && listing.status === "active" && (
                <>
                  {/* Mark as returned */}
                  <button
                    onClick={handleMarkReturned}
                    disabled={marking}
                    style={{
                      padding: "12px", background: marking ? "var(--surface3)" : "var(--ok)",
                      color: "white", border: "none", borderRadius: 12,
                      fontSize: 13.5, fontWeight: 700, cursor: marking ? "not-allowed" : "pointer",
                      transition: "background .15s",
                    }}
                  >
                    {marking ? "Updating…" : "✓ Mark as returned"}
                  </button>
                  <Link href={`/listings/${id}/edit`} style={{ display: "block", textAlign: "center", padding: "11px", background: "var(--surface2)", color: "var(--ink)", borderRadius: 12, fontSize: 13.5, fontWeight: 600, border: "1px solid var(--bdr2)" }}>
                    Edit listing
                  </Link>
                  <Link href="/claims" style={{ display: "block", textAlign: "center", padding: "11px", background: "var(--accent-bg)", color: "var(--accent)", borderRadius: 12, fontSize: 13.5, fontWeight: 600, border: "1px solid var(--accent-bdr)" }}>
                    View claims →
                  </Link>
                </>
              )}

              {/* Already claimed */}
              {isFound && userId && !isOwner && !canClaim && listing.status === "active" && (
                <div style={{ textAlign: "center", padding: "11px", borderRadius: 12, background: "var(--ok-bg)", border: "1px solid var(--ok-bdr)", fontSize: 13, color: "var(--ok)", fontWeight: 600 }}>
                  ✅ Claim submitted
                </div>
              )}

              <div style={{ height: 1, background: "var(--bdr)" }} />
              <Link href="/feed" style={{ fontSize: 13, color: "var(--ink3)", textAlign: "center" }}>← Back to browse</Link>

              {!isOwner && (
                <button
                  onClick={() => alert("Report submitted. Thank you.")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink4)", textDecoration: "underline" }}
                >
                  Report this listing
                </button>
              )}
            </div>

            {/* Share nudge */}
            {!isRecovered && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: "var(--accent-bg)", border: "1px solid var(--accent-bdr)" }}>
                <p style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.55, margin: 0 }}>
                  <strong>Know someone who might help?</strong> Share this listing — the more eyes, the faster the reunion.
                </p>
                <button
                  onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); alert("Link copied!"); }}
                  style={{ marginTop: 10, width: "100%", padding: "8px", background: "var(--accent)", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Copy link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
