"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  label: string;
  onChange: (lat: number, lng: number, label: string) => void;
}

export function LocationPicker({ lat, lng, label, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [manualLabel, setManualLabel] = useState(label);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let resolvedLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`
          );
          const data = await resp.json();
          const addr = data.address;
          resolvedLabel =
            addr.suburb ?? addr.neighbourhood ?? addr.city_district ?? addr.city ?? resolvedLabel;
        } catch {
          // Keep coordinate fallback
        }

        setManualLabel(resolvedLabel);
        onChange(latitude, longitude, resolvedLabel);
        setLoading(false);
      },
      () => {
        setError("Couldn't get your location. Enter it manually below.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }

  async function geocodeLabel() {
    if (!manualLabel.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLabel)}&limit=1`
      );
      const results = await resp.json();
      if (results.length > 0) {
        onChange(parseFloat(results[0].lat), parseFloat(results[0].lon), manualLabel);
      } else {
        setError("Couldn't find that location. Try a more specific address.");
      }
    } catch {
      setError("Location lookup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={useCurrentLocation}
        loading={loading}
        fullWidth
      >
        📍 Use my current location
      </Button>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Or enter area / postcode"
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
            placeholder="e.g. Shoreditch, London"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), geocodeLabel())}
          />
        </div>
        <Button type="button" variant="ghost" size="md" onClick={geocodeLabel} loading={loading}>
          Find
        </Button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--color-destructive)" }}>{error}</p>
      )}

      {lat !== null && lng !== null && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]"
          style={{ background: "var(--color-found-bg)", color: "var(--color-found)" }}
        >
          <span>📍</span>
          <div>
            <p className="text-xs font-semibold">{label || manualLabel}</p>
            <p className="text-xs opacity-70">Approximate location stored · exact coordinates kept private</p>
          </div>
        </div>
      )}
    </div>
  );
}
