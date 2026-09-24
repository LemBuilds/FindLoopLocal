export const LISTING_PHOTOS_BUCKET = "listing-photos";
export const CLAIM_PROOFS_BUCKET = "claim-proofs";

const DEMO_PREFIX = "demo/";

/** Public URL for a listing photo. Demo seed photos are served from /public/images. */
export function listingPhotoUrl(storagePath: string): string {
  if (storagePath.startsWith(DEMO_PREFIX)) {
    return `/images/${storagePath.slice(DEMO_PREFIX.length)}`;
  }
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LISTING_PHOTOS_BUCKET}/${encoded}`;
}
