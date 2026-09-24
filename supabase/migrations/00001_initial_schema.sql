-- FindLoop Phase 1 — Initial Schema
-- Run this in the Supabase SQL Editor

-- Enums
create type listing_type as enum ('lost', 'found');
create type listing_status as enum ('active', 'recovered', 'closed');
create type listing_category as enum ('phones', 'wallets', 'bags', 'jewelry', 'documents', 'electronics', 'pets', 'other');
create type contact_preference as enum ('in_app', 'email');
create type verification_status as enum ('unverified', 'email_verified', 'id_verified');
create type claim_status as enum ('pending', 'accepted', 'rejected', 'expired');
create type match_status as enum ('pending', 'dismissed', 'confirmed');
create type report_reason as enum ('spam', 'inappropriate', 'fake', 'other');
create type report_status as enum ('pending', 'reviewed', 'actioned');

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  city text,
  verification_status verification_status default 'unverified',
  reputation_score integer default 0,
  is_banned boolean default false,
  gdpr_consent_given_at timestamptz,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- Listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  type listing_type not null,
  title text not null check (char_length(title) between 3 and 80),
  category listing_category not null,
  description text not null check (char_length(description) >= 10),
  location_lat double precision not null,
  location_lng double precision not null,
  location_label text not null,
  date_occurred date not null,
  time_occurred time,
  reward_amount integer check (reward_amount >= 0),
  reward_currency text default 'GBP',
  contact_preference contact_preference default 'in_app',
  is_anonymous boolean default false,
  status listing_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index listings_status_idx on listings(status) where deleted_at is null;
create index listings_type_idx on listings(type) where deleted_at is null and status = 'active';
create index listings_category_idx on listings(category) where deleted_at is null;
create index listings_user_idx on listings(user_id);

-- Listing photos
create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  storage_path text not null,
  display_order integer default 0,
  created_at timestamptz default now(),
  constraint max_photos check (display_order < 5)
);

-- Smart match results
create table matches (
  id uuid primary key default gen_random_uuid(),
  lost_listing_id uuid references listings(id) on delete cascade not null,
  found_listing_id uuid references listings(id) on delete cascade not null,
  score double precision not null check (score between 0 and 1),
  category_match boolean not null,
  keyword_score double precision not null,
  distance_km double precision not null,
  date_diff_days integer not null,
  status match_status default 'pending',
  created_at timestamptz default now(),
  unique(lost_listing_id, found_listing_id)
);

create index matches_score_idx on matches(score desc) where status = 'pending';

-- Claims (ownership verification)
create table claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  claimant_id uuid references profiles(id) on delete cascade not null,
  identifying_details text not null check (char_length(identifying_details) >= 20),
  proof_photo_path text,
  status claim_status default 'pending',
  finder_note text,
  queue_position integer not null default 1,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  responded_at timestamptz
  -- "cannot claim own listing" is enforced by a trigger in 00003
  -- (Postgres does not allow subqueries in CHECK constraints).
);

create index claims_listing_idx on claims(listing_id, status);
create index claims_claimant_idx on claims(claimant_id);

-- Reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  listing_id uuid references listings(id) on delete set null,
  reported_user_id uuid references profiles(id) on delete set null,
  reason report_reason not null,
  description text,
  status report_status default 'pending',
  created_at timestamptz default now()
);

-- GDPR consent log
create table consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  consent_version text not null,
  consented_at timestamptz default now(),
  ip_hash text not null,
  withdrawn_at timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, gdpr_consent_given_at)
  values (new.id, new.raw_user_meta_data->>'full_name', now());
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: check if user is admin (extend as needed)
create or replace function is_admin(user_id uuid)
returns boolean language plpgsql security definer as $$
begin
  -- In Phase 1: check a simple admin flag or email list
  -- Replace with proper role system in Phase 2
  return false;
end;
$$;
