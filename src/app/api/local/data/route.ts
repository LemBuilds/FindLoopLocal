import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStore } from "@/lib/local-store";
import type { LocalStoreData } from "@/lib/local-store";

export async function GET() {
  const cookieStore = cookies();
  const raw = cookieStore.get("fl_session")?.value;
  let userId: string | null = null;
  if (raw) {
    try { userId = Buffer.from(raw, "base64url").toString("utf-8"); } catch {}
  }

  const store = getStore();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const photos = Object.values(store.listing_photos) as Record<string, unknown>[];

  type EnrichedListing = Record<string, unknown> & {
    status: string; updated_at: string; created_at: string;
    listing_photos: Record<string, unknown>[]; view_count: number;
  };

  const allListings = Object.values(store.listings) as Record<string, unknown>[];
  const listings = allListings
    .filter(l => !l.deleted_at)
    .map(l => ({
      ...l,
      listing_photos: photos.filter(p => p.listing_id === l.id),
      view_count: store.view_counts[l.id as string] ?? 0,
    } as EnrichedListing));

  const recoveries = listings
    .filter(l => l.status === "recovered")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 12);

  const recentCount = listings.filter(
    l => l.status === "active" && new Date(l.created_at).getTime() > weekAgo
  ).length;

  const matches = Object.values(store.matches) as Record<string, unknown>[];

  let pendingClaimsForUser = 0;
  let userProfile: Record<string, unknown> | null = null;

  if (userId) {
    const userListingIds = new Set(allListings.filter(l => l.user_id === userId).map(l => l.id as string));
    const allClaims = Object.values(store.claims) as Record<string, unknown>[];
    pendingClaimsForUser = allClaims.filter(
      c => userListingIds.has(c.listing_id as string) && c.status === "pending"
    ).length;
    userProfile = (store.profiles[userId] as Record<string, unknown>) ?? null;
  }

  return NextResponse.json({ listings, matches, recoveries, recentCount, pendingClaimsForUser, userProfile, userId });
}

export async function POST(request: Request) {
  const { table, filters = [] } = await request.json() as {
    table: string;
    filters?: { col: string; val: unknown }[];
  };

  const store = getStore();
  const tableData = store[table as keyof LocalStoreData];
  if (!tableData) return NextResponse.json({ data: [] });

  let rows = Object.values(tableData) as Record<string, unknown>[];

  for (const f of filters) {
    rows = rows.filter((r) => r[f.col] === f.val);
  }

  return NextResponse.json({ data: rows });
}
