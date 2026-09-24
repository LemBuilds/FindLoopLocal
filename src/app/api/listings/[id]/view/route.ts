import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("increment_listing_view", { p_listing_id: params.id });
  if (error) return NextResponse.json({ error: "Failed to record view" }, { status: 400 });
  return NextResponse.json({ count: data });
}
