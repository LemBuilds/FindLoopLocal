import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing, Profile } from "@/types";

interface Props { params: { id: string } }

export default async function PublicProfilePage({ params }: Props) {
  const supabase = createClient();
  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.id).is("deleted_at", null).single(),
    supabase.from("listings")
      .select("*, listing_photos(id,storage_path,display_order)")
      .eq("user_id", params.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (!profile) notFound();

  const p = profile as Profile;
  const userListings = (listings ?? []) as Listing[];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar backHref="/feed" />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "var(--color-accent)" }}>
            {p.full_name?.[0] ?? "?"}
          </div>
          <div>
            <h1 className="font-bold text-xl" style={{ color: "var(--color-text)" }}>{p.full_name ?? "Anonymous"}</h1>
            {p.city && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>📍 {p.city}</p>}
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>⭐ {p.reputation_score} reputation · Member since {new Date(p.created_at).getFullYear()}</p>
          </div>
        </div>

        <h2 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>Active listings</h2>
        {userListings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No active listings.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {userListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
