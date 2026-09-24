"use server";

import { createClient } from "@/lib/supabase/server";
import { scoreMatch, MATCH_THRESHOLD } from "@/lib/match";
import type { ListingCategory, ListingType } from "@/types";
import { revalidatePath } from "next/cache";

interface CreateListingInput {
  type: ListingType;
  title: string;
  category: ListingCategory;
  description: string;
  location_lat: number;
  location_lng: number;
  location_label: string;
  date_occurred: string;
  time_occurred?: string;
  reward_amount?: number;
  reward_currency?: string;
  is_anonymous: boolean;
  contact_preference: "in_app" | "email";
  photos: Array<{ name: string; dataUrl: string }>;
}

export async function createListing(input: CreateListingInput): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profileData } = await supabase.from("profiles").select("is_phone_verified").eq("id", user.id).single();
  if (!profileData?.is_phone_verified) return { error: "Please verify your account before posting a listing." };

  const { data: listingRows, error: listingError } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      type: input.type,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      location_label: input.location_label,
      date_occurred: input.date_occurred,
      time_occurred: input.time_occurred ?? null,
      reward_amount: input.reward_amount ?? null,
      reward_currency: input.reward_currency ?? "USD",
      is_anonymous: input.is_anonymous,
      contact_preference: input.contact_preference,
      status: "active",
      updated_at: new Date().toISOString(),
      deleted_at: null,
    })
    .select()
    .single();

  if (listingError || !listingRows) return { error: "Failed to create listing" };
  const listing = listingRows as { id: string };

  for (let i = 0; i < input.photos.length; i++) {
    const photo = input.photos[i];
    const [, base64] = photo.dataUrl.split(",");
    const bytes = Buffer.from(base64, "base64");
    const storagePath = `${user.id}/${listing.id}/${i}-${photo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(storagePath, bytes, { contentType: "image/jpeg", upsert: false });

    if (!uploadError) {
      await supabase.from("listing_photos").insert({
        listing_id: listing.id,
        storage_path: storagePath,
        display_order: i,
      });
    }
  }

  await runMatchingForListing(listing.id, input.type);

  revalidatePath("/");
  revalidatePath("/feed");
  return { id: listing.id };
}

async function runMatchingForListing(listingId: string, type: ListingType) {
  const supabase = createClient();

  const { data: newListingRow } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!newListingRow) return;
  const newListing = newListingRow as Record<string, unknown>;

  const oppositeType: ListingType = type === "lost" ? "found" : "lost";
  const { data: candidateRows } = await supabase
    .from("listings")
    .select("*")
    .eq("type", oppositeType)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(200);

  const candidates = (candidateRows ?? []) as Record<string, unknown>[];
  if (candidates.length === 0) return;

  const inserts = [];
  for (const candidate of candidates) {
    const lostObj = type === "lost" ? newListing : candidate;
    const foundObj = type === "found" ? newListing : candidate;
    const breakdown = scoreMatch(
      lostObj as Parameters<typeof scoreMatch>[0],
      foundObj as Parameters<typeof scoreMatch>[1]
    );

    if (breakdown.score >= MATCH_THRESHOLD) {
      inserts.push({
        lost_listing_id: lostObj.id as string,
        found_listing_id: foundObj.id as string,
        score: breakdown.score,
        category_match: breakdown.category_match,
        keyword_score: breakdown.keyword_score,
        distance_km: breakdown.distance_km,
        date_diff_days: breakdown.date_diff_days,
        status: "pending",
      });
    }
  }

  if (inserts.length > 0) {
    await supabase.from("matches").insert(inserts);
  }
}

export async function updateListingStatus(listingId: string, status: "active" | "recovered" | "closed") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to update listing" };
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/feed");
  return { success: true };
}

export async function deleteListing(listingId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete listing" };
  revalidatePath("/feed");
  return { success: true };
}
