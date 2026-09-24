"use server";

import { createClient } from "@/lib/supabase/server";
import { claimExpiry } from "@/lib/gdpr";
import { revalidatePath } from "next/cache";

export async function submitClaim(input: {
  listing_id: string;
  identifying_details: string;
  proof_photo?: { name: string; dataUrl: string };
}): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profileData } = await supabase.from("profiles").select("is_phone_verified").eq("id", user.id).single();
  if (!profileData?.is_phone_verified) return { error: "Please verify your account before claiming items." };

  const { data: listingRow } = await supabase.from("listings").select("user_id").eq("id", input.listing_id).single();
  if (!listingRow) return { error: "Listing not found" };
  const listing = listingRow as { user_id: string };
  if (listing.user_id === user.id) return { error: "You cannot claim your own listing" };

  const { count: totalAttempts } = await supabase
    .from("claims")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", input.listing_id)
    .eq("claimant_id", user.id);
  if ((totalAttempts ?? 0) >= 3) return { error: "Maximum claim attempts reached for this listing" };

  const { count: activeClaims } = await supabase
    .from("claims")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", input.listing_id)
    .eq("claimant_id", user.id)
    .in("status", ["pending"]);
  if ((activeClaims ?? 0) >= 1) return { error: "You already have an active claim on this listing" };

  const { count: totalActive } = await supabase
    .from("claims")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", input.listing_id)
    .eq("status", "pending");
  if ((totalActive ?? 0) >= 3) return { error: "Maximum active claims reached. Please try again later." };

  let proofPhotoPath: string | null = null;
  if (input.proof_photo) {
    const [, base64] = input.proof_photo.dataUrl.split(",");
    const bytes = Buffer.from(base64, "base64");
    const storagePath = `claims/${input.listing_id}/${user.id}-${input.proof_photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(storagePath, bytes, { contentType: "image/jpeg", upsert: true });
    if (!uploadError) proofPhotoPath = storagePath;
  }

  const { data: maxPosRow } = await supabase
    .from("claims")
    .select("queue_position")
    .eq("listing_id", input.listing_id)
    .order("queue_position", { ascending: false })
    .limit(1)
    .single();

  const nextPos = ((maxPosRow as { queue_position?: number } | null)?.queue_position ?? 0) + 1;

  const { data: claimRows, error: claimError } = await supabase
    .from("claims")
    .insert({
      listing_id: input.listing_id,
      claimant_id: user.id,
      identifying_details: input.identifying_details,
      proof_photo_path: proofPhotoPath,
      status: "pending",
      queue_position: nextPos,
      expires_at: claimExpiry(),
      responded_at: null,
      finder_note: null,
    })
    .select()
    .single();

  if (claimError || !claimRows) return { error: "Failed to submit claim" };

  revalidatePath(`/listings/${input.listing_id}`);
  return { id: (claimRows as { id: string }).id };
}

export async function respondToClaim(input: {
  claim_id: string;
  action: "accept" | "reject";
  finder_note?: string;
}): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: claimRow } = await supabase
    .from("claims")
    .select("listing_id, status")
    .eq("id", input.claim_id)
    .single();
  if (!claimRow) return { error: "Claim not found" };
  const claim = claimRow as { listing_id: string; status: string };
  if (claim.status !== "pending") return { error: "Claim is no longer pending" };

  const { data: listingRow } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", claim.listing_id)
    .single();
  if (!listingRow || (listingRow as { user_id: string }).user_id !== user.id) return { error: "Unauthorized" };

  const newStatus = input.action === "accept" ? "accepted" : "rejected";

  await supabase
    .from("claims")
    .update({
      status: newStatus,
      finder_note: input.finder_note ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", input.claim_id);

  if (input.action === "accept") {
    await supabase
      .from("claims")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("listing_id", claim.listing_id)
      .eq("status", "pending")
      .neq("id", input.claim_id);

    await supabase
      .from("listings")
      .update({ status: "recovered", updated_at: new Date().toISOString() })
      .eq("id", claim.listing_id);
  }

  revalidatePath(`/listings/${claim.listing_id}`);
  revalidatePath("/claims");
  return { success: true };
}
