import { NextResponse } from "next/server";
import { getStore, persistStore } from "@/lib/local-store";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET ?? "local-cron-secret";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const now = new Date().toISOString();
  let expiredCount = 0;

  for (const claim of Object.values(store.claims)) {
    if (claim.status === "pending" && String(claim.expires_at ?? "") < now) {
      claim.status = "expired";
      expiredCount++;
    }
  }

  if (expiredCount > 0) persistStore();

  return NextResponse.json({ expired: expiredCount });
}
