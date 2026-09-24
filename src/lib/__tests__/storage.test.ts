import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { listingPhotoUrl } from "../storage";

describe("listingPhotoUrl", () => {
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("maps demo seed paths to bundled public images", () => {
    expect(listingPhotoUrl("demo/umbrella.jpg")).toBe("/images/umbrella.jpg");
  });

  it("builds a public Supabase Storage URL for uploaded photos", () => {
    expect(listingPhotoUrl("user-1/listing-1/0-photo.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/listing-photos/user-1/listing-1/0-photo.jpg"
    );
  });

  it("encodes path segments with spaces or special characters", () => {
    expect(listingPhotoUrl("u/l/0-my photo#1.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/listing-photos/u/l/0-my%20photo%231.jpg"
    );
  });
});
