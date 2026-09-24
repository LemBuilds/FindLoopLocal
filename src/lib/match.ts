import type { Listing, MatchScoreBreakdown } from "@/types";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "my", "i", "it", "was", "is", "found", "lost", "have",
  "had", "been", "this", "that", "near", "by",
]);

const ADJACENT_CATEGORIES: Record<string, string[]> = {
  phones: ["electronics"],
  electronics: ["phones"],
  bags: ["wallets"],
  wallets: ["bags"],
  jewelry: ["other"],
  other: ["jewelry"],
};

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const aArr = Array.from(a);
  const bArr = Array.from(b);
  const intersection = new Set(aArr.filter((x) => b.has(x)));
  const union = new Set([...aArr, ...bArr]);
  return intersection.size / union.size;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dateDiffDays(d1: string, d2: string): number {
  const diff = Math.abs(
    new Date(d1).getTime() - new Date(d2).getTime()
  );
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function scoreMatch(
  lost: Pick<Listing, "category" | "title" | "description" | "location_lat" | "location_lng" | "date_occurred">,
  found: Pick<Listing, "category" | "title" | "description" | "location_lat" | "location_lng" | "date_occurred">
): MatchScoreBreakdown {
  const categoryMatch = lost.category === found.category;
  const adjacentMatch =
    !categoryMatch &&
    (ADJACENT_CATEGORIES[lost.category]?.includes(found.category) ?? false);

  const categoryScore = categoryMatch ? 1.0 : adjacentMatch ? 0.5 : 0.0;

  const lostTokens = tokenise(`${lost.title} ${lost.description}`);
  const foundTokens = tokenise(`${found.title} ${found.description}`);
  const keyword_score = jaccardSimilarity(lostTokens, foundTokens);

  const distance_km = haversineKm(
    lost.location_lat,
    lost.location_lng,
    found.location_lat,
    found.location_lng
  );
  const locationScore = Math.max(0, 1 - distance_km / 50);

  const date_diff_days = dateDiffDays(lost.date_occurred, found.date_occurred);
  const dateScore = Math.max(0, 1 - date_diff_days / 30);

  const score =
    0.4 * categoryScore +
    0.3 * keyword_score +
    0.2 * locationScore +
    0.1 * dateScore;

  return {
    score,
    category_match: categoryMatch,
    keyword_score,
    distance_km,
    date_diff_days,
  };
}

export const MATCH_THRESHOLD = 0.45;
