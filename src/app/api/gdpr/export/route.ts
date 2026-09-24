import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: profile },
    { data: listings },
    { data: claims },
    { data: consentLog },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("listings").select("*").eq("user_id", user.id),
    supabase.from("claims").select("id,listing_id,status,created_at,expires_at").eq("claimant_id", user.id),
    supabase.from("consent_log").select("consent_version,consented_at,withdrawn_at").eq("user_id", user.id),
  ]);

  const exportData = {
    generated_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile,
    listings: listings ?? [],
    claims: claims ?? [],
    consent_history: consentLog ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="findloop-data-export.json"`,
    },
  });
}
