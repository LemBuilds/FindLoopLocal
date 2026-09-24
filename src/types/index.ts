export type ListingType = "lost" | "found";
export type ListingStatus = "active" | "recovered" | "closed";
export type ListingCategory =
  | "phones"
  | "wallets"
  | "bags"
  | "jewelry"
  | "documents"
  | "electronics"
  | "pets"
  | "other";
export type ContactPreference = "in_app" | "email";
export type VerificationStatus = "unverified" | "email_verified" | "id_verified";
export type ClaimStatus = "pending" | "accepted" | "rejected" | "expired";
export type MatchStatus = "pending" | "dismissed" | "confirmed";
export type ReportStatus = "pending" | "reviewed" | "actioned";
export type ReportReason = "spam" | "inappropriate" | "fake" | "other";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  is_phone_verified: boolean;
  verification_status: VerificationStatus;
  reputation_score: number;
  is_banned: boolean;
  gdpr_consent_given_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Listing {
  id: string;
  /** null for seeded demo listings and listings whose owner deleted their account */
  user_id: string | null;
  type: ListingType;
  title: string;
  category: ListingCategory;
  description: string;
  location_lat: number;
  location_lng: number;
  location_label: string;
  date_occurred: string;
  time_occurred: string | null;
  reward_amount: number | null;
  reward_currency: string;
  contact_preference: ContactPreference;
  is_anonymous: boolean;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  view_count?: number;
  profiles?: Pick<Profile, "full_name" | "avatar_url" | "reputation_score">;
  listing_photos?: ListingPhoto[];
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface Match {
  id: string;
  lost_listing_id: string;
  found_listing_id: string;
  score: number;
  category_match: boolean;
  keyword_score: number;
  distance_km: number;
  date_diff_days: number;
  status: MatchStatus;
  created_at: string;
  lost_listing?: Listing;
  found_listing?: Listing;
}

export interface Claim {
  id: string;
  listing_id: string;
  claimant_id: string;
  identifying_details: string;
  proof_photo_path: string | null;
  status: ClaimStatus;
  finder_note: string | null;
  queue_position: number;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
  profiles?: Pick<Profile, "full_name" | "avatar_url" | "created_at">;
  listing?: Pick<Listing, "title" | "category" | "user_id">;
}

export interface Report {
  id: string;
  reporter_id: string;
  listing_id: string | null;
  reported_user_id: string | null;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export interface ConsentLog {
  id: string;
  user_id: string;
  consent_version: string;
  consented_at: string;
  ip_hash: string;
  withdrawn_at: string | null;
}

export interface MatchScoreBreakdown {
  score: number;
  category_match: boolean;
  keyword_score: number;
  distance_km: number;
  date_diff_days: number;
}
