-- FindLoop Phase 1 — Row Level Security Policies
-- Run this AFTER 00001_initial_schema.sql

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table matches enable row level security;
alter table claims enable row level security;
alter table reports enable row level security;
alter table consent_log enable row level security;

-- ===== PROFILES =====

create policy "Public profiles are viewable by all"
  on profiles for select
  using (deleted_at is null);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ===== LISTINGS =====

create policy "Active listings are public"
  on listings for select
  using (deleted_at is null and status != 'closed');

create policy "Authenticated users can create listings"
  on listings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners can update own listings"
  on listings for update
  using (auth.uid() = user_id);

-- ===== LISTING PHOTOS =====

create policy "Photos are public with their listing"
  on listing_photos for select
  using (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.deleted_at is null
    )
  );

create policy "Owners can insert photos"
  on listing_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.user_id = auth.uid()
    )
  );

-- ===== MATCHES =====

create policy "Users can see matches involving their listings"
  on matches for select
  to authenticated
  using (
    exists (select 1 from listings where id = lost_listing_id and user_id = auth.uid())
    or
    exists (select 1 from listings where id = found_listing_id and user_id = auth.uid())
  );

create policy "System can insert matches"
  on matches for insert
  to authenticated
  with check (true);

-- ===== CLAIMS =====

create policy "Finders can see claims on their listings"
  on claims for select
  to authenticated
  using (
    claimant_id = auth.uid()
    or
    exists (
      select 1 from listings l
      where l.id = claims.listing_id and l.user_id = auth.uid()
    )
  );

create policy "Authenticated users can submit claims"
  on claims for insert
  to authenticated
  with check (auth.uid() = claimant_id);

create policy "Finders can update claim status"
  on claims for update
  to authenticated
  using (
    exists (
      select 1 from listings l
      where l.id = claims.listing_id and l.user_id = auth.uid()
    )
  );

-- ===== REPORTS =====

create policy "Authenticated users can submit reports"
  on reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- ===== CONSENT LOG =====

create policy "Users can see own consent history"
  on consent_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "System can insert consent log"
  on consent_log for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ===== STORAGE BUCKET =====
-- Run this in the Supabase dashboard under Storage:
-- Create a bucket named "listing-photos" with public access ON
-- Or run via SQL:

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Public read listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos');

create policy "Users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
