import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStore, persistStore, generateId, now } from "@/lib/local-store";

/* GET /api/local/reviews?listing_id=xxx */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) return NextResponse.json({ reviews: [] });

  const store = getStore();
  const reviews = Object.values(store.reviews)
    .filter(r => r.listing_id === listingId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ reviews });
}

/* POST /api/local/reviews  — body: { listing_id, rating, comment } */
export async function POST(req: NextRequest) {
  const jar = cookies();
  const sessionId = jar.get("fl-session")?.value;
  if (!sessionId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const store = getStore();
  const user = store.users[sessionId];
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { listing_id, rating, comment } = await req.json() as {
    listing_id: string;
    rating: number;
    comment: string;
  };

  if (!listing_id || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const listing = store.listings[listing_id];
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.status !== "recovered") {
    return NextResponse.json({ error: "Only recovered listings can be reviewed" }, { status: 400 });
  }

  // One review per user per listing
  const existing = Object.values(store.reviews).find(
    r => r.listing_id === listing_id && r.reviewer_id === user.id
  );
  if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const review = {
    id:            generateId(),
    listing_id,
    reviewer_id:   user.id,
    reviewer_name: user.full_name,
    rating,
    comment:       comment.trim(),
    created_at:    now(),
  };

  store.reviews[review.id] = review;
  persistStore();

  return NextResponse.json({ review }, { status: 201 });
}
