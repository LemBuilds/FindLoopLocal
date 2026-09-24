"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Listing } from "@/types";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const foundIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36"><ellipse cx="12" cy="33" rx="5" ry="2" fill="rgba(0,0,0,0.2)"/><path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16S20 13.5 20 8c0-4.42-3.58-8-8-8z" fill="#6BBF8E" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="8" r="3" fill="#fff"/></svg>`),
  iconSize: [20, 30], iconAnchor: [10, 30], popupAnchor: [0, -30],
});

const lostIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36"><ellipse cx="12" cy="33" rx="5" ry="2" fill="rgba(0,0,0,0.2)"/><path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16S20 13.5 20 8c0-4.42-3.58-8-8-8z" fill="#F4A44A" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="8" r="3" fill="#fff"/></svg>`),
  iconSize: [20, 30], iconAnchor: [10, 30], popupAnchor: [0, -30],
});

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.location_lat, l.location_lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [listings, map]);
  return null;
}

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [lat, lng, zoom, map]);
  return null;
}

interface SearchTarget { lat: number; lng: number; zoom: number }

function MapSearch({ onResult }: { onResult: (t: SearchTarget) => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json() as { lat: string; lon: string }[];
      if (data.length > 0) {
        onResult({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), zoom: 13 });
      } else {
        setNotFound(true);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div
      style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, width: "calc(100% - 32px)", maxWidth: 380,
      }}
    >
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex", gap: 6, background: "var(--color-surface)",
          borderRadius: "var(--radius-md)", padding: "6px 6px 6px 12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)", border: "1px solid var(--color-border)",
        }}
      >
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
          placeholder="Search location…"
          style={{
            flex: 1, border: "none", outline: "none", fontSize: 14,
            background: "transparent", color: "var(--color-text)",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "5px 14px", borderRadius: "var(--radius-sm)",
            background: "var(--color-accent)", color: "var(--color-bg)",
            border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            opacity: loading ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {loading ? "…" : "Go"}
        </button>
      </form>
      {notFound && (
        <p style={{
          marginTop: 6, textAlign: "center", fontSize: 12,
          background: "var(--color-surface)", borderRadius: "var(--radius-sm)",
          padding: "4px 10px", color: "var(--color-text-secondary)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}>
          Location not found — try a different search
        </p>
      )}
    </div>
  );
}

interface ListingsMapProps {
  listings: Listing[];
}

export function ListingsMap({ listings }: ListingsMapProps) {
  const center: [number, number] = [51.505, -0.09];
  const [flyTarget, setFlyTarget] = useState<SearchTarget | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapSearch onResult={setFlyTarget} />
      <MapContainer center={center} zoom={12} className="w-full h-full" style={{ zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.length > 0 && !flyTarget && <FitBounds listings={listings} />}
        {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.location_lat, listing.location_lng]}
            icon={listing.type === "found" ? foundIcon : lostIcon}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, marginBottom: 2, fontSize: 13 }}>{listing.title}</p>
                <p style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>{listing.location_label}</p>
                <Link href={`/listings/${listing.id}`} style={{ color: "#F4A44A", fontWeight: 600, fontSize: 12 }}>
                  View listing →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
