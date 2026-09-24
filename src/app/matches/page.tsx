import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Match } from "@/types";

export const metadata = { title: "Matches — FindLoop" };

async function getMatches(userId: string): Promise<Match[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("matches")
    .select(`
      *,
      lost_listing:lost_listing_id(id,title,category,location_label,user_id),
      found_listing:found_listing_id(id,title,category,location_label,user_id)
    `)
    .eq("status", "pending")
    .or(`lost_listing.user_id.eq.${userId},found_listing.user_id.eq.${userId}`)
    .order("score", { ascending: false })
    .limit(20);
  return (data ?? []) as unknown as Match[];
}

export default async function MatchesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const matches = await getMatches(user.id);

  return (
    <PageShell title="Matches">
      {matches.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>No matches yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            When a found item matches your lost listing (or vice versa), it appears here.
          </p>
          <Link href="/post">
            <Button variant="primary">Post a listing</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <Card key={match.id}>
              <div className="flex items-start justify-between mb-2">
                <Badge label={`${Math.round(match.score * 100)}% match`} variant="accent" />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {match.distance_km.toFixed(1)} km apart
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>Lost</p>
                  <Link href={`/listings/${match.lost_listing?.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--color-text)" }}>
                    {match.lost_listing?.title ?? "—"}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{match.lost_listing?.location_label}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>Found</p>
                  <Link href={`/listings/${match.found_listing?.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--color-found)" }}>
                    {match.found_listing?.title ?? "—"}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{match.found_listing?.location_label}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/listings/${match.found_listing?.id}`} className="flex-1">
                  <Button variant="primary" size="sm" fullWidth>View found listing</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
