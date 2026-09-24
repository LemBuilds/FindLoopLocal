import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { phone } = (await request.json().catch(() => ({}))) as { phone?: string };
  if (!phone || phone.trim().length < 5) {
    return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
  }

  const { data: phoneChanged, error } = await supabase.rpc("verify_phone", { p_phone: phone.trim() });
  if (error) {
    console.error("verify_phone failed", error);
    return NextResponse.json({ error: "Could not verify your phone number. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ success: true, phoneChanged });
}
