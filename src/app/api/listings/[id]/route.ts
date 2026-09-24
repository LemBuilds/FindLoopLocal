import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["active", "recovered", "closed"] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_photos(id,listing_id,storage_path,display_order,created_at)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { listing_photos: photos, ...rest } = listing;
  const sortedPhotos = [...(photos ?? [])].sort((a, b) => a.display_order - b.display_order);
  return NextResponse.json({ listing: rest, photos: sortedPhotos, viewCount: rest.view_count ?? 0 });
}

/* PATCH /api/listings/:id — body: { status } */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !ALLOWED_STATUSES.includes(status as Status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("listings PATCH failed", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/listings/${params.id}`);
  return NextResponse.json({ listing });
}
