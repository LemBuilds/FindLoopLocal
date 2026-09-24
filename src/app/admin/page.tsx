import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
import { TopBar } from "@/components/layout/TopBar";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (!isAdminEmail(user.email)) notFound();

  // Reports have no public read policy — admins read them with the service role.
  const { data: reports } = await createAdminClient()
    .from("reports")
    .select("*, profiles:reporter_id(full_name), listing:listing_id(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Admin" backHref="/feed" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-bold text-xl mb-4" style={{ color: "var(--color-text)" }}>Reports queue</h1>
        {!reports || reports.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No pending reports. ✓</p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(reports as any[]).map((r) => (
              <div key={r.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4" style={{ background: "var(--color-surface)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-destructive)" }}>{r.reason}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.listing && <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>Listing: {r.listing.title}</p>}
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{r.description}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Reported by: {r.profiles?.full_name ?? "Unknown"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
