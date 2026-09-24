import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getStore } from "@/lib/local-store";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as {
    email: string;
    password: string;
  };

  const store = getStore();
  const user = Object.values(store.users).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid login credentials" },
      { status: 400 }
    );
  }

  const sessionToken = Buffer.from(user.id).toString("base64url");
  const cookieStore = cookies();
  cookieStore.set("fl_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
