import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET` (GET).
async function expireClaims(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("claims")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("claims/expire failed", error);
    return NextResponse.json({ error: "Failed to expire claims" }, { status: 500 });
  }

  return NextResponse.json({ expired: data?.length ?? 0 });
}

export const GET = expireClaims;
export const POST = expireClaims;
