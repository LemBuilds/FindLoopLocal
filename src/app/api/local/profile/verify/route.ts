import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getStore, persistStore } from "@/lib/local-store";

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const raw = cookieStore.get("fl_session")?.value;
  if (!raw) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let userId: string;
  try {
    userId = Buffer.from(raw, "base64url").toString("utf-8");
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { phone } = await request.json() as { phone?: string };
  if (!phone || phone.trim().length < 5) {
    return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
  }

  const store = getStore();
  const profile = store.profiles[userId];
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const newPhone = phone.trim();
  const phoneChanged = profile.phone !== newPhone;

  store.profiles[userId] = {
    ...profile,
    phone: newPhone,
    // Re-verification completes immediately in local dev mode.
    // If phone changed, it counts as a new verification.
    is_phone_verified: true,
    phone_changed_at: phoneChanged ? new Date().toISOString() : profile.phone_changed_at,
  };
  persistStore();

  return NextResponse.json({ success: true, phoneChanged });
}
