"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

/* ─── Constants ──────────────────────────────────────────── */

const CATEGORIES = [
  { slug: "all",         label: "All categories", emoji: "🔍" },
  { slug: "phones",      label: "Phones",          emoji: "📱" },
  { slug: "wallets",     label: "Wallets",         emoji: "👛" },
  { slug: "bags",        label: "Bags",            emoji: "🎒" },
  { slug: "pets",        label: "Pets",            emoji: "🐾" },
  { slug: "jewelry",     label: "Jewelry",         emoji: "💍" },
  { slug: "electronics", label: "Electronics",     emoji: "🎧" },
  { slug: "documents",   label: "Documents",       emoji: "📄" },
  { slug: "other",       label: "Other",           emoji: "📦" },
];

const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.slug, c.emoji])
);

/* ─── Claim alert ────────────────────────────────────────── */

function ClaimAlert({ count }: { count: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || count === 0) return null;
  return (
    <div style={{
      background: "rgba(230,160,30,.09)", borderBottom: "1px solid rgba(230,160,30,.28)",
      padding: "10px 24px", display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 16 }}>📬</span>
      <span style={{ fontSize: 13.5, color: "#7a5900", fontWeight: 500 }}>
        You have <strong>{count} pending {count === 1 ? "claim" : "claims"}</strong> to review on your listings.
      </span>
      <Link href="/claims" style={{
        fontSize: 13, fontWeight: 700, color: "#7a5900",
        padding: "4px 12px", borderRadius: 8,
        background: "rgba(230,160,30,.18)", border: "1px solid rgba(230,160,30,.35)",
      }}>
        Review now →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          marginLeft: "auto", background: "none", border: "none",
          fontSize: 18, cursor: "pointer", color: "rgba(122,89,0,.5)", lineHeight: 1,
        }}
      >×</button>
    </div>
  );
}

/* ─── Match card ─────────────────────────────────────────── */

interface RawMatch { id: string; lost_listing_id: string; found_listing_id: string; score: number }

function MatchCard({ match, listingMap }: { match: RawMatch; listingMap: Map<string, Listing> }) {
  const lost  = listingMap.get(match.lost_listing_id);
  const found = listingMap.get(match.found_listing_id);
  if (!lost || !found) return null;

  return (
    <div style={{
      background: "var(--surface)", border: "1.5px solid var(--accent-bdr)",
      borderRadius: 18, overflow: "hidden", boxShadow: "var(--sh-sm)",
    }}>
      <div style={{
        background: "var(--accent-bg)", borderBottom: "1px solid var(--accent-bdr)",
        padding: "9px 14px", display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 13 }}>✨</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: .4, textTransform: "uppercase" }}>
          Potential match — {Math.round(match.score * 100)}%
        </span>
      </div>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "9px 11px", background: "var(--danger-bg)", borderRadius: 10, border: "1px solid var(--danger-bdr)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Lost</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{lost.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink3)" }}>📍 {lost.location_label}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 16, color: "var(--ink4)" }}>↕</div>
        <div style={{ padding: "9px 11px", background: "var(--ok-bg)", borderRadius: 10, border: "1px solid var(--ok-bdr)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>Found</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{found.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink3)" }}>📍 {found.location_label}</div>
        </div>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
        <Link href={`/listings/${found.id}`} style={{
          display: "block", textAlign: "center", padding: "10px",
          background: "var(--accent)", color: "white", borderRadius: 10,
          fontSize: 13.5, fontWeight: 700,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = ".88"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          View match →
        </Link>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────── */

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div style={{
      gridColumn: "1 / -1", textAlign: "center",
      padding: "64px 20px", border: "2px dashed var(--bdr2)", borderRadius: 18,
    }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>{filtered ? "🔍" : "📭"}</p>
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
        {filtered ? "No listings match your filters" : "Nothing here yet"}
      </p>
      <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 20 }}>
        {filtered ? "Try a different category or type." : "Be the first to post a listing!"}
      </p>
      {!filtered && (
        <Link href="/post/lost" style={{
          display: "inline-block", padding: "10px 24px",
          background: "var(--accent)", color: "white",
          borderRadius: 12, fontSize: 14, fontWeight: 600,
        }}>
          Post a listing
        </Link>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

type Tab  = "all" | "lost" | "found";
type Sort = "newest" | "reward";

export default function FeedPage() {
  const [allListings, setAllListings] = useState<(Listing & { view_count?: number })[]>([]);
  const [matches,     setMatches]     = useState<RawMatch[]>([]);
  const [recentCount, setRecentCount] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [loading,     setLoading]     = useState(true);

  const [tab,      setTab]      = useState<Tab>("all");
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState<Sort>("newest");

  useEffect(() => {
    fetch("/api/feed")
      .then(r => r.json())
      .then(d => {
        setAllListings(
          ((d.listings ?? []) as (Listing & { view_count?: number })[])
            .filter(l => l.status === "active")
        );
        setMatches((d.matches ?? []) as RawMatch[]);
        setRecentCount(d.recentCount ?? 0);
        setPendingClaims(d.pendingClaimsForUser ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Client-side filter + sort */
  const filtered = useMemo(() => {
    let items = allListings;
    if (tab !== "all")      items = items.filter(l => l.type === tab);
    if (category !== "all") items = items.filter(l => l.category === category);
    if (sort === "reward")  items = [...items].sort((a, b) => (b.reward_amount ?? 0) - (a.reward_amount ?? 0));
    return items;
  }, [allListings, tab, category, sort]);

  const listingMap = new Map(allListings.map(l => [l.id, l]));
  const topMatches = matches
    .filter(m => listingMap.has(m.lost_listing_id) && listingMap.has(m.found_listing_id))
    .slice(0, 3);

  /* Interleave match cards every 6 listings */
  type FeedItem =
    | { kind: "listing"; listing: Listing & { view_count?: number } }
    | { kind: "match";   match: RawMatch };

  const feedItems: FeedItem[] = [];
  let matchIdx = 0;
  filtered.forEach((l, i) => {
    feedItems.push({ kind: "listing", listing: l });
    if ((i + 1) % 6 === 0 && matchIdx < topMatches.length) {
      feedItems.push({ kind: "match", match: topMatches[matchIdx++] });
    }
  });

  const isFiltered = tab !== "all" || category !== "all";
  const lostCount  = allListings.filter(l => l.type === "lost").length;
  const foundCount = allListings.filter(l => l.type === "found").length;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <ClaimAlert count={pendingClaims} />
      <NavBar />

      {/* ── Feed hero banner ─────────────────────────────── */}
      <div style={{ height: 260, position: "relative", overflow: "hidden", background: "#0a1209" }}>
        <Image src="/images/binoculars.jpg" alt="" fill priority
          style={{ objectFit: "cover", objectPosition: "72% 18%", opacity: 0.82 }} />
        {/* Dark veil on left keeps text legible; right is open so binoculars show */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(8,14,11,.92) 0%, rgba(8,14,11,.75) 32%, rgba(8,14,11,.30) 58%, transparent 80%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "white", marginBottom: 4, letterSpacing: -.5 }}>
              Browse listings
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, background: "var(--ok)", borderRadius: "50%", display: "inline-block", animation: "pulse-green 2s ease-in-out infinite" }} />
              Community-run · Privacy-first
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar ───────────────────────────── */}
      <div style={{
        position: "sticky", top: 58, zIndex: 90,
        /* banner is not sticky — filter bar sticks just below the NavBar */
        background: "var(--nav-bg)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        borderBottom: "1px solid var(--bdr)",
      }}>
        {/* Type tabs + sort */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "10px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "lost", "found"] as Tab[]).map(t => {
              const count = t === "all" ? allListings.length : t === "lost" ? lostCount : foundCount;
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
                    fontSize: 13.5, fontWeight: 600,
                    background: active ? "var(--accent)" : "var(--surface2)",
                    color: active ? "white" : "var(--ink3)",
                    transition: "background .15s, color .15s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {t === "all" ? "All" : t === "lost" ? "Lost" : "Found"}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: active ? "rgba(255,255,255,.25)" : "var(--surface3)",
                    color: active ? "white" : "var(--ink3)",
                    padding: "1px 7px", borderRadius: 99,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink4)" }}>Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              style={{
                padding: "6px 10px", border: "1.5px solid var(--bdr2)", borderRadius: 8,
                fontSize: 13, color: "var(--ink)", background: "var(--surface)", outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest first</option>
              <option value="reward">Highest reward</option>
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 24px 10px",
          display: "flex", gap: 6, overflowX: "auto",
        }}>
          {CATEGORIES.map(c => {
            const active = category === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                style={{
                  padding: "5px 12px", borderRadius: 99, border: "1.5px solid",
                  borderColor: active ? "var(--accent)" : "var(--bdr2)",
                  background: active ? "var(--accent-bg)" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--ink3)",
                  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "border-color .15s, background .15s, color .15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 64px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--ink)" }}>
              {loading ? "Loading…" : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""}`}
            </span>
            {isFiltered && (
              <span style={{ fontSize: 13, color: "var(--ink4)", marginLeft: 8 }}>
                ({allListings.length} total)
              </span>
            )}
          </div>

          {recentCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, background: "var(--ok)", borderRadius: "50%",
                animation: "pulse-green 2s ease-in-out infinite", flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                <strong style={{ color: "var(--ink2)" }}>{recentCount}</strong> posted this week
              </span>
            </div>
          )}

          {isFiltered && (
            <button
              onClick={() => { setTab("all"); setCategory("all"); }}
              style={{
                marginLeft: "auto", fontSize: 12.5, color: "var(--ink3)",
                background: "var(--surface2)", border: "none", borderRadius: 8,
                padding: "5px 12px", cursor: "pointer",
              }}
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          /* Skeleton loader */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 320, borderRadius: 18,
                background: "var(--surface)", border: "1px solid var(--bdr)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, var(--surface2) 50%, transparent 100%)",
                  animation: "shimmer-sweep 1.4s infinite",
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {feedItems.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              feedItems.map((item, i) =>
                item.kind === "listing" ? (
                  <ListingCard
                    key={item.listing.id}
                    listing={item.listing}
                    viewCount={item.listing.view_count}
                  />
                ) : (
                  <MatchCard key={`match-${i}`} match={item.match} listingMap={listingMap as Map<string, Listing>} />
                )
              )
            )}
          </div>
        )}

        {/* Post CTA — shown when there are no lost listings */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: 48, padding: "28px 24px",
            background: "var(--surface)", border: "1px solid var(--bdr)",
            borderRadius: 18, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 20, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                Lost something? Can&apos;t see it here?
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink3)" }}>
                Post a listing and let the community help you find it.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/post/found" style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                border: "1.5px solid var(--bdr2)", color: "var(--ink2)", background: "var(--surface)",
              }}>
                I found something
              </Link>
              <Link href="/post/lost" style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                background: "var(--accent)", color: "white",
              }}>
                I lost something
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// referenced in shimmer animation (defined in globals.css)
void CATEGORY_EMOJI;
