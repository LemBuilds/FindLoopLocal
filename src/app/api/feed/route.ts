import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FEED_LIMIT = 200;
const RECOVERIES_LIMIT = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listingRows, error } = await supabase
    .from("listings")
    .select("*, listing_photos(id,storage_path,display_order)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    console.error("feed: failed to load listings", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }

  const listings = listingRows ?? [];
  const weekAgo = Date.now() - WEEK_MS;

  const recoveries = listings
    .filter((l) => l.status === "recovered")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, RECOVERIES_LIMIT);

  const recentCount = listings.filter(
    (l) => l.status === "active" && new Date(l.created_at).getTime() > weekAgo
  ).length;

  // RLS limits matches to those involving the signed-in user's listings.
  const { data: matches } = user
    ? await supabase.from("matches").select("*").eq("status", "pending").order("score", { ascending: false }).limit(20)
    : { data: [] };

  let pendingClaimsForUser = 0;
  let userProfile: Record<string, unknown> | null = null;

  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from("claims")
        .select("id, listings!inner(user_id)", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("listings.user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    pendingClaimsForUser = count ?? 0;
    userProfile = profile;
  }

  return NextResponse.json({
    listings,
    matches: matches ?? [],
    recoveries,
    recentCount,
    pendingClaimsForUser,
    userProfile,
    userId: user?.id ?? null,
  });
}
