import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStore } from "@/lib/local-store";

export async function GET() {
  const cookieStore = cookies();
  const raw = cookieStore.get("fl_session")?.value;
  if (!raw) return NextResponse.json({ user: null });

  try {
    const userId = Buffer.from(raw, "base64url").toString("utf-8");
    const store = getStore();
    const user = store.users[userId];
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
