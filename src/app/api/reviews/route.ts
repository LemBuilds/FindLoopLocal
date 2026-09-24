import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_COMMENT_LENGTH = 2000;

/* GET /api/reviews?listing_id=xxx */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) return NextResponse.json({ reviews: [] });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

/* POST /api/reviews — body: { listing_id, rating, comment } */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });

  const { listing_id, rating, comment } = (await req.json().catch(() => ({}))) as {
    listing_id?: string;
    rating?: number;
    comment?: string;
  };

  const trimmed = comment?.trim() ?? "";
  if (!listing_id || !rating || !trimmed) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Review must be under ${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({ listing_id, reviewer_id: user.id, rating, comment: trimmed })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
    // RLS rejects reviews on listings that are not recovered.
    return NextResponse.json({ error: "Only recovered listings can be reviewed" }, { status: 400 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
