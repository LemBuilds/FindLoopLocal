import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Trigger matching is handled server-side in the createListing action.
  // This endpoint is a manual trigger for admin/testing purposes.
  return NextResponse.json({ message: "Matching runs automatically on listing creation" });
}
