"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import { NavBar } from "@/components/layout/NavBar";
import type { Listing } from "@/types";

/* ─── Design tokens ──────────────────────────────────────── */

const PILL_TEXTS = [
  "You own your data",
  "Your location, your rules",
  "Strangers see only what you share",
  "Messages stay between you two",
  "Delete your account in one tap",
  "No profiles built from your losses",
  "Community-run",
];

const STATS = [
  { label: "items returned",   target: 12847, prefix: "",  suffix: ""  },
  { label: "rewards paid",     target: 248,   prefix: "£", suffix: "K" },
  { label: "active listings",  target: 3241,  prefix: "",  suffix: ""  },
  { label: "cities",           target: 47,    prefix: "",  suffix: ""  },
];

const SEED_REUNIONS = [
  { emoji: "💍", title: "Mum's engagement ring" },
  { emoji: "🐕", title: "Biscuit the French Bulldog" },
  { emoji: "💻", title: "Thesis laptop" },
  { emoji: "🔑", title: "House keys (set of 4)" },
  { emoji: "📱", title: "iPhone 17 Pro Max" },
  { emoji: "🎒", title: "School bag with passport" },
  { emoji: "🐈", title: "Luna — tabby cat" },
];

/* ─── Sub-components ─────────────────────────────────────── */

function PrivacyPill() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % PILL_TEXTS.length);
        setFading(false);
      }, 450);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 14px 6px 10px",
      background: "var(--surface)", border: "1px solid var(--accent-bdr)",
      borderRadius: 99, boxShadow: "var(--sh-sm)", marginBottom: 24,
    }}>
      <span style={{
        width: 8, height: 8, background: "var(--ok)", borderRadius: "50%", flexShrink: 0,
        animation: "pulse-green 2s ease-in-out infinite",
      }} />
      <span style={{
        fontSize: 12.5, fontWeight: 500, color: "var(--ink2)",
        transition: "opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(5px)" : "translateY(0)",
        display: "inline-block",
      }}>
        {PILL_TEXTS[idx]}
      </span>
    </div>
  );
}

function StatCounter({ target, prefix, suffix, label }: { target: number; prefix: string; suffix: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const dur = 1800;
        function tick(now: number) {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(ease * target));
          if (p < 1) requestAnimationFrame(tick);
          else setVal(target);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{
      flex: 1, padding: "22px 24px", textAlign: "center", cursor: "default",
      transition: "background .2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900,
        color: "var(--ink)", letterSpacing: -1, marginBottom: 4,
      }}>
        {prefix}{val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink3)" }}>{label}</div>
    </div>
  );
}

/* Pending claim alert — shown when the logged-in user has items to respond to */
function ClaimAlert({ count }: { count: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      background: "rgba(230,160,30,.09)", borderBottom: "1px solid rgba(230,160,30,.28)",
      padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
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

/* Profile completion nudge — slim progress bar for logged-in users */
function ProfileNudge({ profile }: { profile: Record<string, unknown> }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const fields = [
    !!profile.full_name,
    !!profile.is_phone_verified,
    !!profile.city,
    !!profile.avatar_url,
  ];
  const complete = fields.filter(Boolean).length;
  const pct = Math.round((complete / fields.length) * 100);
  if (pct === 100) return null;

  const missing = [
    !profile.full_name && "name",
    !profile.is_phone_verified && "phone",
    !profile.city && "city",
    !profile.avatar_url && "photo",
  ].filter(Boolean).slice(0, 2).join(" & ");

  return (
    <div style={{
      background: "var(--surface)", borderBottom: "1px solid var(--bdr)",
      padding: "10px 24px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ flex: 1, maxWidth: 640, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          flex: 1, height: 5, background: "var(--surface3)", borderRadius: 99, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "var(--accent)", borderRadius: 99,
            transition: "width 1s cubic-bezier(.22,1,.36,1)",
          }} />
        </div>
        <span style={{ fontSize: 12.5, color: "var(--ink3)", whiteSpace: "nowrap", flexShrink: 0 }}>
          Profile {pct}% — add your <strong style={{ color: "var(--ink2)" }}>{missing}</strong>
        </span>
        <Link href="/profile/me" style={{
          fontSize: 12.5, fontWeight: 700, color: "var(--accent)",
          padding: "4px 12px", borderRadius: 8, background: "var(--accent-bg)",
          border: "1px solid var(--accent-bdr)", flexShrink: 0,
        }}>
          Complete →
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: "none", border: "none", fontSize: 18, cursor: "pointer",
          color: "var(--ink4)", lineHeight: 1, marginLeft: "auto",
        }}
      >×</button>
    </div>
  );
}

/* Reunion ticker — seamlessly looping strip of recovered items */
interface TickerItem { emoji: string; title: string }

function ReunionTicker({ items }: { items: TickerItem[] }) {
  const display = items.length >= 4 ? items : [...items, ...SEED_REUNIONS].slice(0, 8);
  const doubled = [...display, ...display];
  const dur = display.length * 5;

  return (
    <div style={{
      background: "var(--surface2)", borderTop: "1px solid var(--bdr)",
      borderBottom: "1px solid var(--bdr)", padding: "10px 0", overflow: "hidden",
    }}>
      <style>{`@keyframes ticker { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }`}</style>
      <div style={{
        display: "flex", gap: 10,
        animation: `ticker ${dur}s linear infinite`,
        width: "max-content",
      }}>
        {doubled.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 14px", background: "var(--surface)",
            borderRadius: 99, border: "1px solid var(--ok-bdr)", flexShrink: 0,
          }}>
            <span style={{ fontSize: 14 }}>{item.emoji}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink2)", whiteSpace: "nowrap" }}>{item.title}</span>
            <span style={{
              fontSize: 10.5, padding: "2px 8px",
              background: "var(--ok-bg)", color: "var(--ok)",
              borderRadius: 99, fontWeight: 700,
            }}>✓ Reunited</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Activity pulse — items reported this week */
function ActivityPulse({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <span style={{
        width: 8, height: 8, background: "var(--ok)", borderRadius: "50%", flexShrink: 0,
        animation: "pulse-green 2s ease-in-out infinite",
      }} />
      <span style={{ fontSize: 13.5, color: "var(--ink3)" }}>
        <strong style={{ color: "var(--ink2)" }}>{count} item{count !== 1 ? "s" : ""}</strong> reported in your area this week
      </span>
      <Link href="/map" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", marginLeft: 4 }}>
        View map →
      </Link>
    </div>
  );
}

/* Potential match card — inlined in the listings grid */
interface RawMatch { id: string; lost_listing_id: string; found_listing_id: string; score: number }

function MatchCard({ match, listingMap }: { match: RawMatch; listingMap: Map<string, Listing> }) {
  const lost = listingMap.get(match.lost_listing_id);
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
          transition: "opacity .15s",
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

/* ─── FAQ section ────────────────────────────────────────── */

const FAQ_ITEMS = [
  {
    q: "How does FindLoop work?",
    a: "Anyone can post a lost or found listing with a photo, description, and approximate location. Our system automatically looks for potential matches between lost and found items in the same area, then notifies both parties so they can connect securely in-app.",
  },
  {
    q: "Is my personal information safe?",
    a: "Yes. Your exact address and contact details are never shown publicly. You control what you share and with whom. Messages go through our in-app system so neither party needs to reveal a phone number or email until they're ready.",
  },
  {
    q: "How do I claim a found item?",
    a: "Open the found listing, tap 'This is mine', and describe details only the true owner would know. The finder reviews your claim and, if satisfied, can arrange a handover via in-app chat — no personal info exposed in the process.",
  },
  {
    q: "What if someone claims my lost item?",
    a: "You'll receive an in-app notification. You can review their claim description and decide whether to accept or decline. We recommend asking a verification question if you're unsure. Once accepted, in-app chat opens automatically.",
  },
  {
    q: "Can I post anonymously?",
    a: "Yes. Toggle 'Post anonymously' when creating a listing. Your display name will be hidden from the listing; only our moderation team can see account details for safety purposes.",
  },
  {
    q: "How do match notifications work?",
    a: "After posting, our matching engine scans new listings every few minutes. When a found item's description, category, and location overlap with your lost listing above a confidence threshold, you'll receive an in-app and email alert instantly.",
  },
  {
    q: "What happens after a successful reunion?",
    a: "Mark your listing as 'Reunited' and it moves off the active feed. If a reward was offered, you can release it securely through our platform. We'd love you to share a quick reunion note — they show up in the community ticker and inspire others.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{
      background: "var(--surface)", borderTop: "1px solid var(--bdr)",
      borderBottom: "1px solid var(--bdr)", padding: "72px 24px",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "flex-start", gap: 60,
      }}>

        {/* Left — image + label */}
        <div style={{ flex: "0 0 340px", position: "relative", borderRadius: 20, overflow: "hidden", boxShadow: "var(--sh-lg)" }}>
          <div style={{ aspectRatio: "4/5", position: "relative" }}>
            <Image src="/images/faq.jpg" alt="Magnifying glass" fill sizes="340px"
              style={{ objectFit: "cover", objectPosition: "center" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(20,31,23,.78) 0%, rgba(20,31,23,.08) 55%, transparent 100%)",
            }} />
          </div>
          <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1.25, marginBottom: 6 }}>
              Questions answered,<br />worries settled.
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)" }}>
              Everything you need to know about FindLoop.
            </div>
          </div>
        </div>

        {/* Right — accordion */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, letterSpacing: -.5, color: "var(--ink)", marginBottom: 6 }}>
            Frequently asked questions
          </div>
          <div style={{ fontSize: 15, color: "var(--ink3)", marginBottom: 36 }}>
            Can't find the answer? <Link href="/auth/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Chat with us →</Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{
                  borderRadius: 12, border: "1.5px solid",
                  borderColor: isOpen ? "var(--accent-bdr)" : "var(--bdr)",
                  background: isOpen ? "var(--accent-bg)" : "var(--surface)",
                  overflow: "hidden",
                  transition: "border-color .2s, background .2s",
                }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      background: "none", border: "none", cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: isOpen ? "var(--accent)" : "var(--ink)", lineHeight: 1.4 }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: 18, color: isOpen ? "var(--accent)" : "var(--ink4)", flexShrink: 0,
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "transform .25s cubic-bezier(.22,1,.36,1)",
                      display: "inline-block",
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: "0 18px 18px",
                      fontSize: 14, color: "var(--ink3)", lineHeight: 1.75,
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [recoveries, setRecoveries] = useState<TickerItem[]>([]);
  const [matches, setMatches] = useState<RawMatch[]>([]);
  const [recentCount, setRecentCount] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/local/data")
      .then(r => r.json())
      .then(d => {
        const all = (d.listings ?? []) as (Listing & { view_count?: number })[];
        setListings(all.filter(l => l.status === "active").slice(0, 12));
        setRecoveries(
          (d.recoveries ?? []).map((r: Record<string, unknown>) => ({
            emoji: CATEGORY_EMOJI[r.category as string] ?? "📦",
            title: r.title as string,
          }))
        );
        setMatches((d.matches ?? []) as RawMatch[]);
        setRecentCount(d.recentCount ?? 0);
        setPendingClaims(d.pendingClaimsForUser ?? 0);
        setUserProfile(d.userProfile ?? null);
      })
      .catch(() => {});
  }, []);

  const listingMap = new Map(listings.map(l => [l.id, l]));
  const topMatches = matches.filter(m => listingMap.has(m.lost_listing_id) && listingMap.has(m.found_listing_id)).slice(0, 2);

  /* Build interleaved feed: inject match cards after position 2 and 7 */
  type FeedItem =
    | { kind: "listing"; listing: Listing & { view_count?: number } }
    | { kind: "match"; match: RawMatch };

  const feedItems: FeedItem[] = [];
  listings.forEach((l, i) => {
    feedItems.push({ kind: "listing", listing: l as Listing & { view_count?: number } });
    if (i === 2 && topMatches[0]) feedItems.push({ kind: "match", match: topMatches[0] });
    if (i === 7 && topMatches[1]) feedItems.push({ kind: "match", match: topMatches[1] });
  });

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Claim alert — above everything */}
      {pendingClaims > 0 && <ClaimAlert count={pendingClaims} />}

      <NavBar />

      {/* Profile nudge — directly below nav */}
      {userProfile && <ProfileNudge profile={userProfile} />}

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        background: "var(--hero-grad)", padding: "80px 32px 72px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Community photo — very subtle behind gradient */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/images/community.jpg" alt="" fill priority
            style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.32 }} />
        </div>
        <div style={{
          position: "absolute", top: -200, right: -120, width: 600, height: 600,
          border: "1px solid var(--ink)", borderRadius: "50%", opacity: .04,
          animation: "spin 40s linear infinite", pointerEvents: "none", zIndex: 1,
        }} />
        <div style={{
          position: "absolute", bottom: -100, right: 60, width: 340, height: 340,
          border: "1px solid var(--ink)", borderRadius: "50%", opacity: .06,
          animation: "spin 28s linear infinite reverse", pointerEvents: "none", zIndex: 1,
        }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 60, position: "relative", zIndex: 2 }}>
          {/* Left col */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <PrivacyPill />
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 900,
              fontSize: "clamp(38px, 5vw, 58px)", letterSpacing: -2.5, lineHeight: 1.1,
              color: "var(--ink)", marginBottom: 18,
            }}>
              Where{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>lost things</em>
              <br />find their way home.
            </h1>
            <p style={{
              fontSize: 16.5, color: "var(--ink3)", lineHeight: 1.72,
              maxWidth: 420, marginBottom: 28,
            }}>
              A community-run lost &amp; found where{" "}
              <strong style={{ color: "var(--ink2)", fontWeight: 600 }}>your data stays yours</strong>.
              {" "}We connect the people who lose things with the people who find them —
              no ads, no trackers, no middlemen.
            </p>

            <Link href="/search" style={{
              maxWidth: 440, display: "flex", alignItems: "center", gap: 10,
              background: "var(--surface)", border: "1.5px solid var(--bdr2)",
              borderRadius: 16, boxShadow: "var(--sh-md)", padding: "8px 8px 8px 16px",
              marginBottom: 20, transition: "box-shadow .2s",
            }}>
              <span style={{ fontSize: 18, color: "var(--ink4)", flexShrink: 0 }}>🔍</span>
              <span style={{ flex: 1, fontSize: 14, color: "var(--ink4)" }}>Search by item, location, category…</span>
              <span style={{
                padding: "8px 18px", background: "var(--accent)", color: "white",
                borderRadius: 10, fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}>Search</span>
            </Link>

            <div style={{ display: "flex", gap: 12, maxWidth: 440 }}>
              {[
                { href: "/post/lost",  emoji: "😔", label: "I lost something",  sub: "Post a listing",  hover: "var(--danger)" },
                { href: "/post/found", emoji: "🤝", label: "I found something", sub: "Help return it",   hover: "var(--ok)"     },
              ].map(card => (
                <Link key={card.href} href={card.href} style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 16px", background: "var(--surface)",
                  border: "1.5px solid var(--bdr)", borderRadius: 14,
                  boxShadow: "var(--sh-sm)", cursor: "pointer",
                  transition: "transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-md)";
                    (e.currentTarget as HTMLElement).style.borderColor = card.hover;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-sm)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--bdr)";
                  }}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{card.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{card.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>{card.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right col — photo listing cards */}
          <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { photo: "/images/umbrella.jpg", title: "Blue compact umbrella", loc: "Temple Bar, Dublin",   badge: "Found", badgeColor: "var(--ok)",     offset: 0  },
              { photo: "/images/cap.jpg",       title: "Beige baseball cap",    loc: "Grafton St, Dublin",  badge: "Found", badgeColor: "var(--ok)",     offset: 20 },
              { photo: "/images/backpack-red.jpg", title: "Red Herschel backpack", loc: "Dublin Mountains", badge: "Lost",  badgeColor: "var(--danger)", offset: 10 },
            ].map((c, i) => (
              <div key={i} style={{
                height: 158, borderRadius: 16, overflow: "hidden", position: "relative",
                boxShadow: "var(--sh-md)", marginLeft: c.offset, cursor: "default",
                transition: "transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(8px) translateY(-3px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-lg)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-md)";
                }}
              >
                <Image src={c.photo} alt={c.title} fill sizes="320px"
                  style={{ objectFit: "cover" }} />
                {/* Gradient overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.08) 55%, transparent 100%)",
                }} />
                {/* Badge */}
                <span style={{
                  position: "absolute", top: 10, left: 10,
                  fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                  color: "white", background: c.badgeColor,
                  textTransform: "uppercase", letterSpacing: .6,
                }}>{c.badge}</span>
                {/* Title + location */}
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 3, textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>{c.title}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.78)" }}>📍 {c.loc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REUNION TICKER ───────────────────────────────── */}
      <ReunionTicker items={recoveries} />

      {/* ── STATS BELT ──────────────────────────────────── */}
      <div style={{
        display: "flex", background: "var(--surface)",
        borderTop: "1px solid var(--bdr)", borderBottom: "1px solid var(--bdr)",
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ flex: 1, borderRight: i < STATS.length - 1 ? "1px solid var(--bdr)" : "none" }}>
            <StatCounter {...s} />
          </div>
        ))}
      </div>

      {/* ── FEED ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, letterSpacing: -.5, color: "var(--ink)" }}>
              Recent listings
            </div>
            <div style={{ fontSize: 14, color: "var(--ink3)", marginTop: 4 }}>Updated moments ago</div>
          </div>
          <Link href="/feed" style={{
            fontSize: 13.5, fontWeight: 600, color: "var(--accent)",
            display: "flex", alignItems: "center", gap: 4,
            transition: "transform .2s, color .2s", padding: "4px 0",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(3px)"; (e.currentTarget as HTMLElement).style.color = "var(--accent-d)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
          >
            View all →
          </Link>
        </div>

        <ActivityPulse count={recentCount} />

        {feedItems.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "64px 20px",
            border: "2px dashed var(--bdr2)", borderRadius: 18,
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 15, color: "var(--ink3)" }}>No listings yet — be the first to post!</p>
            <Link href="/post/lost" style={{
              display: "inline-block", marginTop: 20, padding: "10px 24px",
              background: "var(--accent)", color: "white", borderRadius: 12,
              fontSize: 14, fontWeight: 600,
            }}>Post a listing</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {feedItems.map((item, i) =>
              item.kind === "listing" ? (
                <ListingCard
                  key={item.listing.id}
                  listing={item.listing}
                  viewCount={item.listing.view_count}
                />
              ) : (
                <MatchCard key={`match-${i}`} match={item.match} listingMap={listingMap} />
              )
            )}
          </div>
        )}
      </div>

      {/* ── ALERTS ──────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", borderTop: "1px solid var(--bdr)",
        borderBottom: "1px solid var(--bdr)", padding: "40px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
              📬 Get notified instantly
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink3)" }}>
              We&apos;ll ping you the moment a matching item appears near you.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select style={{
              padding: "9px 14px", border: "1.5px solid var(--bdr2)", borderRadius: 10,
              fontSize: 13.5, color: "var(--ink)", background: "var(--bg)", outline: "none",
            }}>
              <option>Within 1 mile</option>
              <option>Within 5 miles</option>
              <option>Within 10 miles</option>
              <option>My city</option>
            </select>
            <Link href="/auth/signup" style={{
              padding: "10px 20px", background: "var(--accent)", borderRadius: 10,
              fontSize: 13.5, fontWeight: 600, color: "white",
              transition: "transform .2s, box-shadow .2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(46,125,82,.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              Enable alerts
            </Link>
          </div>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <FaqSection />

      {/* ── REUNION STORIES ─────────────────────────────── */}
      <div style={{ background: "var(--bg-inverse)", padding: "80px 24px", position: "relative", overflow: "hidden", minHeight: 560 }}>
        {/* Fist-bump — full colour, high opacity, positioned so hands land in the open right zone */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/fist-bump.jpg" alt="" fill
            style={{ objectFit: "cover", objectPosition: "65% center", opacity: 0.55 }} />
        </div>
        {/* Dark veil fades from left (cards readable) to transparent (image visible on right) */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(8,14,11,.96) 0%, rgba(8,14,11,.88) 32%, rgba(8,14,11,.55) 54%, rgba(8,14,11,.10) 78%, transparent 100%)",
        }} />
        {/* Subtle green accent on left edge */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(46,125,82,.14) 0%, transparent 45%)",
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 0 }}>

          {/* ── LEFT zone: heading + stacked cards ── */}
          <div style={{ flex: "0 0 440px" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#FFFFFF", letterSpacing: -.5, marginBottom: 8 }}>
                They found their<br />way home.
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,.60)" }}>Real reunions, real people.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { emoji: "💍", name: "Sarah K.", hearts: 247, title: '"My mum\'s ring came home"', body: "Lost my mum's engagement ring at JFK. A cleaner posted it on FindLoop 6 hours later. I was on a flight back before the listing was 12 hours old." },
                { emoji: "🐕", name: "Marcus T.", hearts: 412, title: '"Biscuit came home"', body: "Missing 3 days. A neighbour saw the listing, recognised him immediately, and rang within the hour. No personal details shared before I was ready." },
                { emoji: "💻", name: "Priya M.", hearts: 189, title: '"My thesis survived"', body: "Left my laptop on the Edinburgh train. The finder posted it within 20 minutes of arriving at the terminus. £150 reward felt like nothing." },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.13)",
                  borderRadius: 14, padding: "16px 18px", cursor: "default",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  transition: "transform .3s cubic-bezier(.22,1,.36,1), background .2s, border-color .2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(6px)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.22)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = "";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.13)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1.2 }}>{s.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", fontStyle: "italic", lineHeight: 1.3 }}>{s.title}</div>
                        <div style={{
                          flexShrink: 0, padding: "2px 8px", background: "rgba(61,165,105,.22)",
                          border: "1px solid rgba(61,165,105,.40)", borderRadius: 99,
                          fontSize: 10, fontWeight: 700, color: "#5AC882",
                        }}>✓ Reunited</div>
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.65, marginBottom: 10 }}>{s.body}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)", fontWeight: 500 }}>{s.name}</span>
                        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)" }}>❤ {s.hearts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT zone: intentionally empty — image shows through ── */}
          <div style={{ flex: 1 }} />
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-inverse-2)", padding: "28px 24px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,.08)",
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "var(--accent-l)" }}>FindLoop</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.40)", marginLeft: 16 }}>Community-run · Privacy-first</span>
      </div>
    </div>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  phones: "📱", wallets: "👛", bags: "🎒", jewelry: "💍",
  documents: "📄", electronics: "🎧", pets: "🐾", other: "📦",
};
