import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing, ListingCategory, ListingType } from "@/types";

const CATEGORIES = ["phones", "wallets", "bags", "jewelry", "documents", "electronics", "pets", "other"];

interface Props {
  searchParams: { q?: string; type?: string; category?: string };
}

export const metadata = { title: "Search — FindLoop" };

async function search(q: string, type?: string, category?: string): Promise<Listing[]> {
  const supabase = createClient();
  let query = supabase
    .from("listings")
    .select("*, listing_photos(id,storage_path,display_order)")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (type && (type === "lost" || type === "found")) {
    query = query.eq("type", type as ListingType);
  }
  if (category && CATEGORIES.includes(category)) {
    query = query.eq("category", category as ListingCategory);
  }
  if (q.trim()) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data } = await query;
  return (data ?? []) as Listing[];
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const listings = await search(q, searchParams.type, searchParams.category);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Search" backHref="/" />
      <div className="max-w-lg mx-auto px-4 py-4 pb-8">
        <form method="GET" className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search items, locations…"
                className="flex-1 py-2.5 text-sm bg-transparent outline-none"
                style={{ color: "var(--color-text)" }}
                autoFocus
              />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-white" style={{ background: "var(--color-accent)" }}>
              Go
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {[{ label: "All", type: "" }, { label: "Lost", type: "lost" }, { label: "Found", type: "found" }].map((t) => (
              <a
                key={t.type}
                href={`/search?q=${encodeURIComponent(q)}&type=${t.type}${searchParams.category ? `&category=${searchParams.category}` : ""}`}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
                style={{
                  background: (searchParams.type ?? "") === t.type ? "var(--color-text)" : "var(--color-surface)",
                  color: (searchParams.type ?? "") === t.type ? "var(--color-bg)" : "var(--color-text-secondary)",
                  borderColor: "var(--color-border)",
                }}
              >
                {t.label}
              </a>
            ))}
            <span className="text-[var(--color-border)]">|</span>
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/search?q=${encodeURIComponent(q)}${searchParams.type ? `&type=${searchParams.type}` : ""}&category=${cat === searchParams.category ? "" : cat}`}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors capitalize"
                style={{
                  background: searchParams.category === cat ? "var(--color-accent)" : "var(--color-surface)",
                  color: searchParams.category === cat ? "#fff" : "var(--color-text-secondary)",
                  borderColor: "var(--color-border)",
                }}
              >
                {cat}
              </a>
            ))}
          </div>
        </form>

        {q && (
          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
            {listings.length} result{listings.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          </p>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {q ? `No results for "${q}"` : "Start typing to search"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
