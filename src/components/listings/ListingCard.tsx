import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatReward } from "@/lib/currency";
import { listingPhotoUrl } from "@/lib/storage";

interface ListingCardProps {
  listing: Listing;
  matchScore?: number;
  viewCount?: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  phones:      "📱",
  wallets:     "👛",
  bags:        "🎒",
  jewelry:     "💍",
  documents:   "📄",
  electronics: "🎧",
  pets:        "🐾",
  other:       "📦",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ListingCard({ listing, matchScore, viewCount }: ListingCardProps) {
  const photo = listing.listing_photos?.[0];
  const emoji = CATEGORY_EMOJI[listing.category] ?? "📦";
  const hasReward = listing.reward_amount && listing.reward_amount > 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="lcard"
      style={{
        display: "block", position: "relative",
        background: "var(--surface)", border: "1px solid var(--bdr)",
        borderRadius: 18, overflow: "hidden", boxShadow: "var(--sh-sm)",
        textDecoration: "none",
      }}
    >
      {/* Image */}
      <div className="lcard-img" style={{ height: 175, overflow: "hidden", position: "relative", background: "var(--surface2)" }}>
        {photo ? (
          <Image
            src={listingPhotoUrl(photo.storage_path)}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 300px"
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
            {emoji}
          </div>
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
          <StatusBadge type={listing.type} status={listing.status} />
        </div>

        {/* Match score */}
        {matchScore !== undefined && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 9px", borderRadius: 99,
            background: "var(--accent-bg)", color: "var(--accent)",
            fontSize: 10, fontWeight: 700, border: "1px solid var(--accent-bdr)",
          }}>
            {Math.round(matchScore * 100)}% match
          </div>
        )}

        {/* Reward chip */}
        {hasReward && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            padding: "4px 10px", background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            borderRadius: 99, fontSize: 12, fontWeight: 700, color: "var(--accent)",
            transition: "transform .2s",
          }}>
            {formatReward(listing.reward_amount!, listing.reward_currency ?? "USD")}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "15px 17px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -.2, color: "var(--ink)", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {listing.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          📍 {listing.location_label}
        </div>
        {listing.description && (
          <div style={{
            fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5, marginBottom: 12,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {listing.description}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: "var(--ink4)" }}>
            {timeAgo(listing.date_occurred)}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {viewCount !== undefined && viewCount > 0 && (
              <span style={{ fontSize: 11, color: "var(--ink4)", display: "flex", alignItems: "center", gap: 3 }}>
                👁 {viewCount}
              </span>
            )}
            {hasReward && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                {formatReward(listing.reward_amount!, listing.reward_currency ?? "USD")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
