import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Must satisfy the claims.identifying_details length check (>= 20 chars).
const REDACTED_DETAILS = "[Removed at the user's request]";

export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Service role: several of these rows have no user-writable RLS policy.
  const admin = createAdminClient();
  const deletedAt = new Date().toISOString();

  const results = await Promise.all([
    admin.from("profiles").update({ deleted_at: deletedAt, full_name: null, avatar_url: null }).eq("id", user.id),
    admin.from("profile_private").delete().eq("id", user.id),
    admin.from("listings").update({ deleted_at: deletedAt }).eq("user_id", user.id),
    admin.from("claims").update({ identifying_details: REDACTED_DETAILS }).eq("claimant_id", user.id),
    admin.from("consent_log").update({ withdrawn_at: deletedAt }).eq("user_id", user.id).is("withdrawn_at", null),
  ]);

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("gdpr account deletion failed", failed.error);
    return NextResponse.json({ error: "Failed to delete account data. Please contact support." }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true, message: "Account and personal data deleted" });
}
