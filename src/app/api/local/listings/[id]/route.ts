import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStore, persistStore, now } from "@/lib/local-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const listing = store.listings[params.id];
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = Object.values(store.listing_photos).filter(
    p => p.listing_id === params.id
  );
  const viewCount = store.view_counts[params.id] ?? 0;

  return NextResponse.json({ listing, photos, viewCount });
}

/* PATCH /api/local/listings/:id  — body: { status } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jar = cookies();
  const sessionId = jar.get("fl-session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const store = getStore();
  const user = store.users[sessionId];
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const listing = store.listings[params.id];
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json() as { status: string };
  const allowed = ["active", "recovered", "closed"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  store.listings[params.id] = { ...listing, status, updated_at: now() };
  persistStore();

  return NextResponse.json({ listing: store.listings[params.id] });
}
