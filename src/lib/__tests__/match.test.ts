import { describe, it, expect } from "vitest";
import { scoreMatch, MATCH_THRESHOLD } from "../match";

const base = {
  location_lat: 51.5236,
  location_lng: -0.0777,
  date_occurred: "2026-05-20",
};

describe("scoreMatch", () => {
  it("scores 1.0 for identical listings", () => {
    const listing = {
      ...base,
      category: "phones" as const,
      title: "iPhone 14 Pro black",
      description: "Black iPhone 14 Pro with cracked back glass",
    };
    const { score } = scoreMatch(listing, listing);
    expect(score).toBeCloseTo(1.0, 1);
  });

  it("scores below threshold for completely different listings", () => {
    const lost = {
      ...base,
      category: "phones" as const,
      title: "iPhone",
      description: "lost my phone",
    };
    const found = {
      ...base,
      location_lat: 52.0,
      location_lng: 0.5,
      date_occurred: "2026-03-01",
      category: "pets" as const,
      title: "dog found",
      description: "found a dog in the park",
    };
    const { score } = scoreMatch(lost, found);
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  it("awards 0.5 for adjacent category match (phones ↔ electronics)", () => {
    const lost = { ...base, category: "phones" as const, title: "phone", description: "phone" };
    const found = { ...base, category: "electronics" as const, title: "phone", description: "phone" };
    const { category_match, score } = scoreMatch(lost, found);
    expect(category_match).toBe(false);
    expect(score).toBeGreaterThan(0.4);
  });

  it("penalises distance beyond 50 km to zero location score", () => {
    const lost = { ...base, category: "phones" as const, title: "phone", description: "phone" };
    const far = {
      ...base,
      location_lat: 53.5,
      location_lng: -2.2,
      category: "phones" as const,
      title: "phone",
      description: "phone",
    };
    const { score } = scoreMatch(lost, far);
    expect(score).toBeLessThan(scoreMatch(lost, { ...lost }).score);
  });

  it("returns distance_km and date_diff_days in breakdown", () => {
    const lost = { ...base, category: "wallets" as const, title: "wallet", description: "brown leather wallet" };
    const found = {
      location_lat: 51.5246,
      location_lng: -0.0787,
      date_occurred: "2026-05-18",
      category: "wallets" as const,
      title: "wallet",
      description: "brown leather wallet",
    };
    const result = scoreMatch(lost, found);
    expect(result.distance_km).toBeGreaterThan(0);
    expect(result.date_diff_days).toBe(2);
  });
});
