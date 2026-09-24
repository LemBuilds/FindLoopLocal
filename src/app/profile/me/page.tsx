import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/layout/PageShell";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Listing, Profile } from "@/types";

export const metadata = { title: "Profile — FindLoop" };

export default async function MyProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("*, listing_photos(id,storage_path,display_order)")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const p = profile as Profile | null;
  const myListings = (listings ?? []) as Listing[];

  return (
    <PageShell title="Profile">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "var(--color-accent)" }}>
          {p?.full_name?.[0] ?? user.email?.[0] ?? "?"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg truncate" style={{ color: "var(--color-text)" }}>{p?.full_name ?? "—"}</h2>
            {p?.is_phone_verified ? (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--color-found-bg)", color: "var(--color-found)" }}>✓ Verified</span>
            ) : (
              <Link href="/profile/verify" className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }}>
                Unverified
              </Link>
            )}
          </div>
          <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>{user.email}</p>
          {p?.phone && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{p.phone}</p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>⭐ {p?.reputation_score ?? 0} reputation</p>
        </div>
      </div>

      {/* Verification prompt */}
      {!p?.is_phone_verified && (
        <Link
          href="/profile/verify"
          className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] mb-4"
          style={{ background: "rgba(229,85,85,0.06)", border: "1px solid rgba(229,85,85,0.2)" }}
        >
          <span className="text-lg">🔐</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-destructive)" }}>Verify your account</p>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Required to post listings and claim items</p>
          </div>
          <span className="ml-auto text-xs" style={{ color: "var(--color-accent)" }}>→</span>
        </Link>
      )}

      {/* My listings */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>My listings</h3>
          <Link href="/post">
            <Button variant="secondary" size="sm">+ New</Button>
          </Link>
        </div>
        {myListings.length === 0 ? (
          <div className="text-center py-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* GDPR / account settings */}
      <section className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
        <h3 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>Account & privacy</h3>
        <Link href="/profile/verify">
          <Button variant="secondary" size="sm" fullWidth>
            {p?.is_phone_verified ? "Change phone number" : "Verify account"}
          </Button>
        </Link>
        <Link href="/api/gdpr/export" target="_blank">
          <Button variant="secondary" size="sm" fullWidth>Download my data (GDPR)</Button>
        </Link>
        <LogoutButton />
      </section>
    </PageShell>
  );
}
