import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getStore, generateId, now, persistStore } from "@/lib/local-store";
import { CONSENT_VERSION, hashIp } from "@/lib/gdpr";

export async function POST(request: NextRequest) {
  const { email, password, full_name } = await request.json() as {
    email: string;
    password: string;
    full_name?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const store = getStore();
  const existing = Object.values(store.users).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const userId = generateId();
  const createdAt = now();

  store.users[userId] = {
    id: userId,
    email,
    password,
    full_name: full_name ?? "",
    created_at: createdAt,
  };

  store.profiles[userId] = {
    id: userId,
    full_name: full_name ?? null,
    avatar_url: null,
    city: null,
    phone: null,
    is_phone_verified: false,
    verification_status: "email_verified",
    reputation_score: 0,
    is_banned: false,
    gdpr_consent_given_at: createdAt,
    created_at: createdAt,
    deleted_at: null,
  };

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const ipHash = await hashIp(ip);
  const consentId = generateId();
  store.consent_log[consentId] = {
    id: consentId,
    user_id: userId,
    consent_version: CONSENT_VERSION,
    consented_at: createdAt,
    created_at: createdAt,
    ip_hash: ipHash,
    withdrawn_at: null,
  };

  persistStore();

  const sessionToken = Buffer.from(userId).toString("base64url");
  const cookieStore = cookies();
  cookieStore.set("fl_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ user: { id: userId, email } });
}
