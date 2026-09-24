"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ListingCategory, ListingType } from "@/types";
import { createListing } from "@/actions/listings";
import { detectPii } from "@/lib/privacy";
import { detectDefaultCurrency, formatReward } from "@/lib/currency";
import { StepIndicator } from "./StepIndicator";
import { CategoryGrid } from "./CategoryGrid";
import { PhotoUploader, type UploadedPhoto } from "./PhotoUploader";
import { LocationPicker } from "./LocationPicker";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CurrencySelect } from "@/components/ui/CurrencySelect";

const STEPS = ["Category", "Details", "Photos", "Location", "Review"];

interface PostListingFormProps {
  type: ListingType;
}

export function PostListingForm({ type }: PostListingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [category, setCategory] = useState<ListingCategory | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOccurred, setDateOccurred] = useState("");
  const [timeOccurred, setTimeOccurred] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardCurrency, setRewardCurrency] = useState("USD");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactPreference] = useState<"in_app" | "email">("in_app");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    setRewardCurrency(detectDefaultCurrency());
  }, []);

  const piiResult = detectPii(description);

  function handleLocation(newLat: number, newLng: number, label: string) {
    setLat(newLat);
    setLng(newLng);
    setLocationLabel(label);
  }

  function canAdvance(): boolean {
    if (step === 0) return category !== "";
    if (step === 1) return title.trim().length >= 3 && description.trim().length >= 10 && !!dateOccurred;
    if (step === 2) return true; // photos optional
    if (step === 3) return lat !== null && lng !== null;
    return true;
  }

  async function handleSubmit() {
    if (!category || lat === null || lng === null) return;
    setLoading(true);
    setServerError(null);

    const result = await createListing({
      type,
      title,
      category: category as ListingCategory,
      description,
      location_lat: lat,
      location_lng: lng,
      location_label: locationLabel,
      date_occurred: dateOccurred,
      time_occurred: timeOccurred || undefined,
      reward_amount: rewardAmount ? parseInt(rewardAmount, 10) : undefined,
      reward_currency: rewardCurrency,
      is_anonymous: isAnonymous,
      contact_preference: contactPreference,
      photos: photos.map((p) => ({ name: p.file.name, dataUrl: p.dataUrl })),
    });

    if ("error" in result) {
      setServerError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/listings/${result.id}?posted=1`);
  }

  const color = type === "found" ? "var(--color-found)" : "var(--color-accent)";
  const emoji = type === "found" ? "🎉" : "😔";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{emoji}</span>
        <h1 className="font-bold text-xl" style={{ color: "var(--color-text)" }}>
          {type === "found" ? "Report found item" : "Report lost item"}
        </h1>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {/* Step 0: Category */}
      {step === 0 && (
        <div>
          <h2 className="font-semibold mb-3" style={{ color: "var(--color-text)" }}>What type of item?</h2>
          <CategoryGrid value={category} onChange={setCategory} />
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>Describe the item</h2>

          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "found" ? "e.g. Found: AirPods Pro" : "e.g. Lost: Brown leather wallet"}
            maxLength={80}
          />

          <div>
            <Textarea
              label="Description *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Colour, brand, distinguishing features… The more detail the better."
              maxLength={500}
              charCount={description.length}
              maxChars={500}
            />
            {piiResult.hasPii && (
              <div className="mt-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }}>
                ⚠️ Your description may contain {piiResult.labels.join(", ")}. Please remove personal details for your safety.
              </div>
            )}
          </div>

          <Input
            label="Date occurred *"
            type="date"
            value={dateOccurred}
            onChange={(e) => setDateOccurred(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />

          <Input
            label="Approximate time (optional)"
            type="time"
            value={timeOccurred}
            onChange={(e) => setTimeOccurred(e.target.value)}
          />

          {type === "lost" && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--color-text-secondary)" }}>
                Reward amount (optional)
              </span>
              <div className="flex gap-2">
                <CurrencySelect value={rewardCurrency} onChange={setRewardCurrency} />
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="e.g. 50"
                  className="flex-1 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-colors duration-[var(--duration-fast)]"
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Post anonymously (hide your name)</span>
          </label>
        </div>
      )}

      {/* Step 2: Photos */}
      {step === 2 && (
        <div>
          <h2 className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>Add photos</h2>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>Photos are optional but help a lot. You can blur sensitive areas.</p>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>Where was it?</h2>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
            Only an approximate area is shown publicly. Exact coordinates are kept private for matching only.
          </p>
          <LocationPicker lat={lat} lng={lng} label={locationLabel} onChange={handleLocation} />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>Review & post</h2>

          {serverError && (
            <div className="px-4 py-3 rounded-[var(--radius-sm)] text-sm" style={{ background: "rgba(229,85,85,0.08)", color: "var(--color-destructive)" }} role="alert">
              {serverError}
            </div>
          )}

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 flex flex-col gap-2 text-sm" style={{ background: "var(--color-surface)" }}>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Type:</span> <strong style={{ color }}>{type === "found" ? "Found" : "Lost"}</strong></p>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Category:</span> {category}</p>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Title:</span> {title}</p>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Location:</span> {locationLabel}</p>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Date:</span> {dateOccurred}</p>
            <p><span style={{ color: "var(--color-text-secondary)" }}>Photos:</span> {photos.length}</p>
            {rewardAmount && <p><span style={{ color: "var(--color-text-secondary)" }}>Reward:</span> {formatReward(parseInt(rewardAmount, 10), rewardCurrency)}</p>}
          </div>

          <div className="px-4 py-3 rounded-[var(--radius-sm)] text-xs" style={{ background: "var(--color-found-bg)", color: "var(--color-found)" }}>
            🔒 Your exact location is never shown publicly. Personal details are processed under GDPR.
          </div>

          <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSubmit}>
            Post listing
          </Button>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="ghost" size="md" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
            style={{ background: color }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
