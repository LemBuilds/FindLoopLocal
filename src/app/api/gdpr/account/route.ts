import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Soft-delete profile and listings
  await Promise.all([
    supabase.from("profiles").update({ deleted_at: new Date().toISOString(), full_name: null, avatar_url: null }).eq("id", user.id),
    supabase.from("listings").update({ deleted_at: new Date().toISOString() }).eq("user_id", user.id),
    supabase.from("claims").update({ identifying_details: "[DELETED]" }).eq("claimant_id", user.id),
    supabase.from("consent_log").update({ withdrawn_at: new Date().toISOString() }).eq("user_id", user.id).is("withdrawn_at", null),
  ]);

  await supabase.auth.signOut();

  return NextResponse.json({ success: true, message: "Account and personal data deleted" });
}
