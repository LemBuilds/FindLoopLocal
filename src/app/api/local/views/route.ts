import { NextResponse, type NextRequest } from "next/server";
import { getStore, persistStore } from "@/lib/local-store";

export async function POST(request: NextRequest) {
  const { listing_id } = await request.json() as { listing_id?: string };
  if (!listing_id) return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });

  const store = getStore();
  store.view_counts[listing_id] = (store.view_counts[listing_id] ?? 0) + 1;
  persistStore();

  return NextResponse.json({ count: store.view_counts[listing_id] });
}
