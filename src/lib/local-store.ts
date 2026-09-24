import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  created_at: string;
}

export type Row = Record<string, unknown>;

export interface ReviewRow {
  id: string;
  listing_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;       // 1–5
  comment: string;
  created_at: string;
}

export interface LocalStoreData {
  users: Record<string, LocalUser>;
  profiles: Record<string, Row>;
  listings: Record<string, Row>;
  listing_photos: Record<string, Row>;
  matches: Record<string, Row>;
  claims: Record<string, Row>;
  consent_log: Record<string, Row>;
  reports: Record<string, Row>;
  view_counts: Record<string, number>;
  reviews: Record<string, ReviewRow>;
}

const DATA_FILE = path.join(process.cwd(), ".local-data.json");

const EMPTY: LocalStoreData = {
  users: {},
  profiles: {},
  listings: {},
  listing_photos: {},
  matches: {},
  claims: {},
  consent_log: {},
  reports: {},
  view_counts: {},
  reviews: {},
};

function loadFromDisk(): LocalStoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as LocalStoreData;
    }
  } catch {}
  return structuredClone(EMPTY);
}

const _store: LocalStoreData = loadFromDisk();

/* ── Demo seed ───────────────────────────────────────────── */

const DEMO_SYSTEM_USER = "demo-system";

const DEMO_SEED: { listing: Row; photo: Row; views: number }[] = [
  {
    listing: {
      id: "demo-001", user_id: DEMO_SYSTEM_USER, type: "found",
      title: "Blue compact umbrella", category: "other",
      description: "Found a light blue compact umbrella with a wooden handle and red ball tip, left against a brick wall during a rain shower.",
      location_lat: 53.3454, location_lng: -6.2672, location_label: "Temple Bar, Dublin",
      date_occurred: "2026-05-20", time_occurred: null,
      reward_amount: null, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-001", listing_id: "demo-001", storage_path: "demo/umbrella.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 34,
  },
  {
    listing: {
      id: "demo-002", user_id: DEMO_SYSTEM_USER, type: "found",
      title: "Ornate brass key", category: "other",
      description: "Found an old ornate brass key among the leaves near the park path. No keyring attached.",
      location_lat: 53.3567, location_lng: -6.3271, location_label: "Phoenix Park, Dublin",
      date_occurred: "2026-05-18", time_occurred: null,
      reward_amount: null, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-002", listing_id: "demo-002", storage_path: "demo/key.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 58,
  },
  {
    listing: {
      id: "demo-003", user_id: DEMO_SYSTEM_USER, type: "lost",
      title: "Red Herschel backpack", category: "bags",
      description: "Lost my red Herschel backpack in the mountains. Has 3 enamel badge pins on the front pocket and a water bottle holder on the side. Very sentimental.",
      location_lat: 53.2500, location_lng: -6.3800, location_label: "Dublin Mountains",
      date_occurred: "2026-05-22", time_occurred: "14:30",
      reward_amount: 50, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-003", listing_id: "demo-003", storage_path: "demo/backpack-red.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 91,
  },
  {
    listing: {
      id: "demo-004", user_id: DEMO_SYSTEM_USER, type: "found",
      title: "Beige baseball cap", category: "other",
      description: "Found a lightly worn beige cotton baseball cap hanging on a railing near the shopping area. No obvious brand markings.",
      location_lat: 53.3415, location_lng: -6.2596, location_label: "Grafton Street, Dublin",
      date_occurred: "2026-05-23", time_occurred: null,
      reward_amount: null, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-004", listing_id: "demo-004", storage_path: "demo/cap.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 22,
  },
  {
    listing: {
      id: "demo-005", user_id: DEMO_SYSTEM_USER, type: "found",
      title: "Gold Michael Kors watch", category: "jewelry",
      description: "Found a gold-tone Michael Kors chronograph watch among fallen leaves. Working condition. Roman numeral dial.",
      location_lat: 53.3382, location_lng: -6.2591, location_label: "St. Stephen's Green, Dublin",
      date_occurred: "2026-05-21", time_occurred: "11:00",
      reward_amount: null, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-005", listing_id: "demo-005", storage_path: "demo/watch.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 143,
  },
  {
    listing: {
      id: "demo-006", user_id: DEMO_SYSTEM_USER, type: "found",
      title: "Black leather messenger bag", category: "bags",
      description: "Found a black leather messenger bag left on a park bench. Contains what appears to be documents and a phone charger.",
      location_lat: 53.3394, location_lng: -6.2526, location_label: "Merrion Square, Dublin",
      date_occurred: "2026-05-24", time_occurred: "09:15",
      reward_amount: null, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-006", listing_id: "demo-006", storage_path: "demo/bag-bench.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 67,
  },
  {
    listing: {
      id: "demo-007", user_id: DEMO_SYSTEM_USER, type: "lost",
      title: "Black hiking backpack", category: "bags",
      description: "Lost my black hiking backpack — Fjällräven style with brown leather tag and two side clips. Had hiking gear inside including a rain jacket and snacks.",
      location_lat: 53.1700, location_lng: -6.1200, location_label: "Wicklow Mountains",
      date_occurred: "2026-05-19", time_occurred: "15:00",
      reward_amount: 75, reward_currency: "GBP",
      contact_preference: "in_app", is_anonymous: false, status: "active",
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 86400000).toISOString(), deleted_at: null,
    },
    photo: { id: "demo-photo-007", listing_id: "demo-007", storage_path: "demo/backpack-forest.jpg", display_order: 0, created_at: new Date().toISOString() },
    views: 112,
  },
];

function seedIfEmpty(store: LocalStoreData): void {
  if (Object.keys(store.listings).length > 0) return;
  for (const { listing, photo, views } of DEMO_SEED) {
    store.listings[listing.id as string]       = listing;
    store.listing_photos[photo.id as string]   = photo;
    store.view_counts[listing.id as string]    = views;
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

seedIfEmpty(_store);

export function getStore(): LocalStoreData {
  if (!_store.view_counts) _store.view_counts = {};
  if (!_store.reviews)     _store.reviews     = {};
  return _store;
}

export function persistStore(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(_store, null, 2), "utf-8");
  } catch {}
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
