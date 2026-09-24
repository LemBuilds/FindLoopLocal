# FindLoop — Phase 1 Design Spec

**Date:** 2026-05-22  
**Status:** Approved  
**Scope:** Phase 1 MVP — Auth, Lost/Found Posting, Search/Filter, Map, Smart Match, Item Status, Privacy Safeguards  
**Phase 2 (out of scope here):** In-app Messaging, Rewards processing, Push Notifications, Admin Dashboard  

---

## 1. Overview

FindLoop is a mobile-first lost and found web application that allows users to post lost or found items, discover potential matches, and reconnect with their belongings through community-powered recovery.

**Design direction:** Warm Minimal — off-white base (#FAFAF8), amber accent (#F4A44A), sage green for found (#6BBF8E), warm charcoal dark mode (#181614). Light and dark mode toggle. Font: system-ui / Inter. Feels clean, trustworthy, and native to iOS/modern Android.

**Compliance:** GDPR (EU) and EU AI Act compliant from day one.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components for fast feed rendering; Server Actions for match scoring |
| Backend / DB | Supabase (local Docker in dev) | Auth + PostgreSQL + Storage + RLS in one — zero cloud cost locally |
| Styling | Tailwind CSS + CSS custom properties | Utility classes + design tokens for light/dark theming |
| Maps | react-leaflet + OpenStreetMap | Free, no API key, no lock-in |
| Language | TypeScript | Type safety throughout |

**Local dev:** `supabase start` runs the full stack in Docker. No cloud account needed until deployment.

---

## 3. Architecture

```
Browser (Client)
├── React Client Components — Map, Forms, Modals, Theme toggle, Photo blur editor
├── react-leaflet — OpenStreetMap tiles
├── Tailwind + CSS custom props — light/dark tokens
└── Supabase JS client — auth session, storage uploads

        ↕ HTTP / RSC payload

Next.js 14 App Router (Server)
├── Server Components — Feed, Listing detail, Profile pages
├── Server Actions — Create listing, Match scoring, Status updates
├── Route Handlers — GDPR export, GDPR account deletion, Match trigger
└── Middleware — Auth guard, GDPR consent check on first visit

        ↕ Supabase SDK (server-side only)

Supabase (local Docker → cloud on deploy)
├── Auth — Email/password, Google OAuth, Apple OAuth (wired pre-deploy)
├── PostgreSQL + RLS — Row-level security enforces data isolation
├── Storage — Item photos (max 5 per listing, blurred client-side before upload)
└── Realtime — Reserved for Phase 2 messaging
```

**Key principle:** The Supabase `service_role` key is never exposed to the client bundle. All privileged operations go through Server Actions or Route Handlers.

---

## 4. Data Model

### 4.1 `profiles`
Extends `auth.users`. One row per user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK → auth.users |
| full_name | text | |
| avatar_url | text | Supabase Storage path |
| city | text | |
| verification_status | enum | unverified / pending / verified |
| reputation_score | int | Default 0. Future-ready. |
| is_banned | bool | Default false |
| gdpr_consent_given_at | timestamptz | Set at signup |
| created_at | timestamptz | |
| deleted_at | timestamptz | Null = active. Soft delete for GDPR erasure. |

### 4.2 `listings`
Core table. Covers both lost and found via `type` enum.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | → profiles |
| type | enum | lost / found |
| title | text | |
| category | enum | phones / wallets / bags / jewelry / documents / electronics / pets / other |
| description | text | |
| location_lat | float8 | Stored precisely. Displayed blurred to ~500m publicly. |
| location_lng | float8 | |
| location_label | text | Human-readable neighbourhood label |
| date_occurred | date | |
| time_occurred | time | Nullable |
| reward_amount | int | Nullable. In pence/cents. Lost listings only. |
| reward_currency | text | Default 'GBP' |
| contact_preference | enum | in_app / email |
| is_anonymous | bool | Default false. Found listings only. |
| status | enum | active / recovered / closed |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | Soft delete for GDPR erasure |

### 4.3 `listing_photos`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK | → listings |
| storage_path | text | Supabase Storage path |
| display_order | int | 0-indexed |
| created_at | timestamptz | |

Max 5 photos per listing. Photos are blurred client-side via Canvas API before upload — the original never leaves the device unmodified.

### 4.4 `matches`
Stores rule-based match results between a lost and a found listing.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lost_listing_id | uuid FK | → listings |
| found_listing_id | uuid FK | → listings |
| score | float | 0–1 composite score |
| category_match | bool | Signal breakdown |
| keyword_score | float | Signal breakdown |
| distance_km | float | Signal breakdown |
| date_diff_days | int | Signal breakdown |
| status | enum | pending / dismissed / confirmed |
| created_at | timestamptz | |

### 4.5 `claims`
Records ownership verification attempts against found listings.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK | → listings (must be type: found) |
| claimant_id | uuid FK | → profiles (cannot equal listing.user_id) |
| identifying_details | text | Min 20 chars. Private — visible to finder only. |
| proof_photo_path | text | Nullable. Supabase Storage path. |
| status | enum | pending / accepted / rejected / expired |
| finder_note | text | Nullable. Rejection reason from finder. |
| queue_position | int | Order among active claims on same listing (1-indexed) |
| expires_at | timestamptz | Set to created_at + 48h |
| created_at | timestamptz | |
| responded_at | timestamptz | Nullable. Set when finder accepts or rejects. |

**Constraints:**
- Max 3 active (`pending`) claims per listing at any time
- One accepted claim per listing — accepting auto-rejects all others
- Claimant cannot have more than 1 active claim per listing simultaneously

### 4.6 `reports`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| reporter_id | uuid FK | → profiles |
| listing_id | uuid FK | Nullable → listings |
| reported_user_id | uuid FK | Nullable → profiles |
| reason | enum | spam / inappropriate / fake / other |
| description | text | |
| status | enum | pending / reviewed / actioned |
| created_at | timestamptz | |

### 4.6 `consent_log`
Immutable GDPR audit trail.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | → profiles |
| consent_version | text | e.g. "1.0" |
| consented_at | timestamptz | |
| ip_hash | text | SHA-256 of IP. Never raw address. |
| withdrawn_at | timestamptz | Nullable. Set on account deletion. |

### RLS Policy Summary

- **profiles** — users read/write their own row only
- **listings** — public read of non-deleted rows; users write/update their own only
- **listing_photos** — follows parent listing ownership
- **matches** — visible to both listing owners
- **claims** — claimant reads/inserts their own; finder reads claims on their listings; neither party reads the other's other claims
- **reports** — users insert their own; read their own only
- **consent_log** — users insert and read their own only
- Admin `service_role` key bypasses RLS server-side only

---

## 5. Route Structure

### Public (no auth required)

| Route | Purpose |
|---|---|
| `/` | Landing page — browse recent listings, search prompt |
| `/auth/login` | Email/password, Google, Apple (pre-deploy) |
| `/auth/signup` | Registration, consent capture, profile setup |
| `/auth/forgot-password` | Email reset via Supabase |
| `/auth/callback` | OAuth redirect handler |
| `/listings/[id]` | Public listing detail — photos, blurred location, report button |
| `/search` | Full search + filters (category, date, location, type) |
| `/map` | Leaflet map — all active listings, tap pin → listing card |

### Authenticated (middleware guard)

| Route | Purpose |
|---|---|
| `/feed` | Personalised feed — nearby items, match alerts |
| `/post` | Picker screen — lost or found |
| `/post/lost` | 5-step form — category, details, photos+blur, location, review+reward |
| `/post/found` | 4-step form — category, details+photos+blur, location, review+anonymous |
| `/listings/[id]/edit` | Edit own listing, update status |
| `/listings/[id]/claim` | Submit ownership claim form against a found listing |
| `/matches` | All suggested matches — confirm or dismiss with score breakdown |
| `/claims` | All claims — submitted by me (as claimant) and received on my listings (as finder) |
| `/claims/[id]` | Claim detail — finder accepts or rejects; claimant sees current status |
| `/profile/me` | My listings, settings, GDPR export, delete account |
| `/profile/[id]` | Public profile — reputation, active listings |

### Route Handlers

| Route | Purpose |
|---|---|
| `POST /api/gdpr/export` | Download all personal data as JSON (Art. 20) |
| `DELETE /api/gdpr/account` | Right to erasure — soft-delete + anonymise (Art. 17) |
| `POST /api/matches/run` | Trigger match scoring after new listing created |
| `POST /api/claims/expire` | Called by Supabase cron — marks overdue pending claims as expired, advances queue |

### Admin

`/admin/*` — protected by `role = admin` check in middleware. Listings review, user bans, reports queue. Server-rendered only, never in client bundle.

---

## 6. Smart Match Algorithm

Runs as a Next.js Server Action triggered when a new listing is posted. Scores all active listings of the opposite type within a 50km radius.

**Score = weighted sum of four signals:**

| Signal | Weight | Calculation |
|---|---|---|
| Category match | 40% | Exact = 1.0, adjacent = 0.5 (phones↔electronics, bags↔wallets, jewelry↔other), different = 0 |
| Keyword overlap | 30% | Jaccard similarity on title + description tokens, stopwords stripped |
| Location distance | 20% | `max(0, 1 − distance_km / 50)` |
| Date proximity | 10% | `max(0, 1 − date_diff_days / 30)` |

**Threshold:** Pairs scoring ≥ 0.45 are written to `matches` as `status: pending` and surfaced to both listing owners on `/matches`.

**Transparency:** Each match stores the full signal breakdown (category_match, keyword_score, distance_km, date_diff_days) so users can see exactly why a match was suggested.

**No background job in Phase 1** — scoring runs synchronously on listing creation. Queue added in Phase 2 if needed.

---

## 7. Post Listing Flow

Both flows begin with a **Picker screen** (lost vs found) before the numbered steps.

### Lost (5 steps after picker)

1. **Category** — tap grid of 8 categories
2. **Details** — title (required), description (required), inline PII hint on description
3. **Photos** — upload up to 5 photos; privacy warning banner; canvas blur/redact editor opens per photo; user draws rectangles over sensitive areas; blurred image uploaded (original never leaves device)
4. **Location + Date** — draggable map pin (Leaflet), date picker, optional time
5. **Review + Reward** — summary card, optional reward amount (GBP), contact preference, post

### Found (4 steps after picker)

1. **Category**
2. **Details + Photos** — title, description, PII hint, and photo upload/blur combined on one screen
3. **Location + Date**
4. **Review** — summary card, anonymous toggle, post (no reward field)

### Privacy safeguards on photo upload (Option B)

- Warning banner shown before upload: checklist of what to avoid (faces, addresses, ID, plates)
- After each photo is selected, a canvas-based editor opens automatically
- User drags to draw rectangles over sensitive areas → area pixelated in-browser
- Controls: "Done" (upload blurred), "Redo" (clear selections), "Remove photo" (cancel)
- Blurred image sent to Supabase Storage — original never transmitted
- Description field: regex check for UK/EU phone numbers (`07\d{9}`, `\+44\d+`), email addresses (`\S+@\S+\.\S+`), and UK postcodes (`[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}`) — inline nudge shown below field if detected, user can dismiss or edit

---

## 8. Claim Flow (Ownership Verification)

### Overview

When a user believes a found listing matches their lost item, they can submit a private ownership claim. The finder reviews it and accepts or rejects. On acceptance, contact details are revealed so the return can be coordinated. In Phase 2, contact reveal is replaced by in-app chat.

### Status lifecycle

```
submitted → pending → accepted  → [contact revealed, lost owner marks Recovered]
                   → rejected  → [claimant notified, may resubmit up to 3 total attempts]
                   → expired   → [no finder response in 48h, queue advances]
```

### Claimant journey

1. Views a found listing — sees **"This is mine"** button (authenticated users only; hidden on own listings)
2. If another claim is already pending, sees notice: *"A claim is currently under review. You can still submit yours."*
3. Fills in the claim form at `/listings/[id]/claim`:
   - **Identifying details** (required, min 20 chars) — serial number, unique markings, contents, anything not visible in photos
   - **Proof photo** (optional) — receipt, original purchase screenshot, or pre-loss photo of the item
4. Submits → claim written with `status: pending`, `expires_at: now + 48h`, `queue_position` assigned
5. Sees status page at `/claims/[id]` — polling every 60s in Phase 1, Realtime in Phase 2

### Finder journey

1. Notified in-app when a new claim arrives on their listing
2. Reviews claims at `/claims` — queue ordered by `created_at` ascending (oldest first)
3. On `/claims/[id]` sees: claimant profile, their identifying details, optional proof photo, 48h countdown
4. Actions:
   - **Accept** — claim status → accepted; all other pending claims on same listing → auto-rejected; claimant's contact revealed to finder and vice versa (based on contact_preference); listing status unchanged (lost owner marks recovered separately)
   - **Reject** — claim status → rejected; optional note to claimant; next claim in queue becomes active; claimant notified with finder's note (or generic message if no note)

### Multiple claimants

- Max 3 active (`pending`) claims per listing simultaneously — 4th submission blocked with a message
- Only the **oldest pending claim** is shown to the finder at a time — sequential review, not a comparison list
- Claims are processed one by one in arrival order
- Accepting one claim instantly rejects all others with notification: *"This item was claimed by someone else. If you believe this is an error, you can report the listing."*

### Expiry

- A Supabase pg_cron job calls `POST /api/claims/expire` every 30 minutes
- Any claim with `expires_at < now` and `status: pending` is marked `expired`
- Next claim in queue (by `queue_position`) becomes the active claim the finder sees
- Claimant notified: *"The finder didn't respond in time. You can submit a new claim."*

### Anti-abuse rules

- Cannot claim your own listing
- Cannot submit more than 1 active claim per listing at a time
- Max 3 total claim attempts per user per listing (across all statuses)
- Accepted claims create an audit record — used for dispute resolution in Phase 2

### GDPR notes

- `identifying_details` and `proof_photo_path` are personal data — deleted (not soft-deleted) when claim expires, is rejected after 30 days, or either party deletes their account
- `GDPR export` includes all claims the user submitted and received
- Proof photos purged from Supabase Storage on claim deletion

---

## 9. GDPR Compliance

| Obligation | Implementation |
|---|---|
| Lawful basis | Explicit consent at signup, logged in `consent_log` with version + timestamp + IP hash |
| Data minimisation | Location stored as lat/lng, displayed blurred to ~500m on public views |
| Right of access | `POST /api/gdpr/export` returns all user data as downloadable JSON |
| Right to erasure | `DELETE /api/gdpr/account` soft-deletes listings, anonymises profile, marks consent withdrawn, hard-deletes claim data |
| Data portability | Same export endpoint, structured JSON format |
| Security | RLS on all tables, IP as SHA-256 hash, HTTPS enforced, service_role key server-only |
| Privacy by default | Found items can be anonymous; location precision reduced on all public views |

---

## 9. EU AI Act Compliance

FindLoop's Smart Match is a **rule-based deterministic scoring system** — no ML model, no training data, no probabilistic inference. Under the EU AI Act this does **not** qualify as an AI system. No registration, conformity assessment, or high-risk classification applies.

**Transparency obligation (applies regardless):** Every suggested match shows the score breakdown to both users — category, distance, date, keyword signals displayed on `/matches`. Users understand why a match was suggested.

**Phase 3 note:** If LLM-based semantic matching is added, Art. 13 transparency obligations and limited-risk classification will apply. A separate compliance review will be required at that point.

**Photo blur tool:** Canvas API pixel manipulation — not AI, not biometric processing. No EU AI Act exposure.

---

## 10. Design Tokens

```css
:root {
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F0EDE8;
  --color-border: #EDE9E3;
  --color-text: #1A1A1A;
  --color-text-secondary: #888888;
  --color-accent: #F4A44A;
  --color-found: #6BBF8E;
  --color-found-bg: #E8F5EE;
  --color-accent-bg: #FFF3E0;
}

[data-theme="dark"] {
  --color-bg: #181614;
  --color-surface: #231F1C;
  --color-surface-muted: #2A2520;
  --color-border: #2E2925;
  --color-text: #F0EDE8;
  --color-text-secondary: #666666;
  --color-accent: #F4A44A;
  --color-found: #5BBF8E;
  --color-found-bg: #1A3028;
  --color-accent-bg: #3A2D1A;
}
```

---

## 11. Phase 2 (Out of Scope)

The following features are deferred to Phase 2 and will have their own spec:

- In-app real-time messaging (Supabase Realtime)
- Push notifications
- Reward marking (paid/unpaid display)
- Full admin dashboard UI
- Apple Sign-In (requires Apple Developer account — placeholder button in Phase 1)
- Reputation score mechanics

---

## 12. Success Criteria for Phase 1

- [ ] User can sign up, log in, and log out (email + Google)
- [ ] User can post a lost item with photos, location, and optional reward
- [ ] User can post a found item with photos, location, and optional anonymity
- [ ] Smart match runs on listing creation and surfaces results on `/matches`
- [ ] Map shows all active listings with tappable pins
- [ ] Search and filters return correct results
- [ ] User can submit a claim against a found listing with identifying details
- [ ] Finder can accept or reject a claim within 48h
- [ ] Accepting a claim reveals contact details and auto-rejects competing claims
- [ ] Claims expire after 48h of no finder response and queue advances
- [ ] Max 3 active claims per listing enforced
- [ ] User can mark their listing as recovered or closed
- [ ] GDPR data export and account deletion work end-to-end, including claim data
- [ ] Consent is captured and logged at signup
- [ ] Photo blur editor prevents PII upload
- [ ] Light and dark mode toggle works across all pages
- [ ] Production build passes with 0 errors
