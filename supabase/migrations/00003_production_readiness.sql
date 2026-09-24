-- FindLoop — production readiness
-- Run this AFTER 00002_rls_policies.sql
-- Adds everything the app needs that the local JSON store used to fake:
-- phone verification, view counts, reviews, private claim proofs, demo seed.

-- ===== PROFILES: phone verification =====

alter table profiles add column if not exists is_phone_verified boolean not null default false;

-- Phone numbers live in a separate owner-only table so the public
-- "profiles are viewable by all" policy never exposes them.
create table if not exists profile_private (
  id uuid primary key references profiles(id) on delete cascade,
  phone text,
  phone_changed_at timestamptz
);

alter table profile_private enable row level security;

create policy "Users can see own private profile"
  on profile_private for select
  to authenticated
  using (auth.uid() = id);

-- Users may only edit harmless profile columns directly. Verification,
-- reputation, ban and deletion flags are changed by trusted code only.
revoke update on profiles from anon, authenticated;
grant update (full_name, avatar_url, city) on profiles to authenticated;

-- Self-attested phone verification (no SMS yet — swap for Supabase phone OTP later).
create or replace function public.verify_phone(p_phone text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_phone text := trim(p_phone);
  v_changed boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if v_phone is null or char_length(v_phone) < 5 or char_length(v_phone) > 32 then
    raise exception 'Please enter a valid phone number';
  end if;

  select coalesce(phone is distinct from v_phone, true) into v_changed
    from profile_private where id = v_uid;
  v_changed := coalesce(v_changed, true);

  insert into profile_private (id, phone, phone_changed_at)
  values (v_uid, v_phone, now())
  on conflict (id) do update
    set phone = excluded.phone,
        phone_changed_at = case when v_changed then now() else profile_private.phone_changed_at end;

  update profiles set is_phone_verified = true where id = v_uid;
  return v_changed;
end;
$$;

revoke execute on function public.verify_phone(text) from public, anon;
grant execute on function public.verify_phone(text) to authenticated;

-- ===== LISTINGS: view counts + owner visibility =====

alter table listings add column if not exists view_count integer not null default 0;

create or replace function public.increment_listing_view(p_listing_id uuid)
returns integer language sql security definer set search_path = public as $$
  update listings set view_count = view_count + 1
  where id = p_listing_id and deleted_at is null
  returning view_count;
$$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;

-- Owners can always see their own (e.g. closed) listings.
create policy "Owners can see own listings"
  on listings for select
  to authenticated
  using (auth.uid() = user_id);

-- Owners cannot hand a listing to another user.
drop policy if exists "Owners can update own listings" on listings;
create policy "Owners can update own listings"
  on listings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== MATCHES =====
-- Matches are computed and inserted server-side with the service role.
drop policy if exists "System can insert matches" on matches;

-- ===== CLAIMS: cannot claim own listing =====

create or replace function public.prevent_self_claim()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from listings where id = new.listing_id and user_id = new.claimant_id
  ) then
    raise exception 'You cannot claim your own listing';
  end if;
  return new;
end;
$$;

drop trigger if exists claims_prevent_self_claim on claims;
create trigger claims_prevent_self_claim
  before insert or update of claimant_id, listing_id on claims
  for each row execute procedure public.prevent_self_claim();

-- ===== REVIEWS =====

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewer_name text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 2000),
  created_at timestamptz default now(),
  unique (listing_id, reviewer_id)
);

create index if not exists reviews_listing_idx on reviews(listing_id, created_at desc);

alter table reviews enable row level security;

create policy "Reviews are public"
  on reviews for select
  using (true);

create policy "Users can review recovered listings"
  on reviews for insert
  to authenticated
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from listings l
      where l.id = reviews.listing_id and l.status = 'recovered' and l.deleted_at is null
    )
  );

-- reviewer_name always comes from the reviewer's profile, never the client.
create or replace function public.set_reviewer_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(full_name, 'Community member') into new.reviewer_name
    from profiles where id = new.reviewer_id;
  return new;
end;
$$;

drop trigger if exists reviews_set_reviewer_name on reviews;
create trigger reviews_set_reviewer_name
  before insert on reviews
  for each row execute procedure public.set_reviewer_name();

-- ===== STORAGE =====

-- Listing photos: users may only upload into their own folder ({user_id}/...).
drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Users can upload listing photos to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Claim proof photos are private: path is {listing_id}/{claimant_id}/{file}.
insert into storage.buckets (id, name, public)
values ('claim-proofs', 'claim-proofs', false)
on conflict (id) do nothing;

create policy "Claimants can upload own proof photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'claim-proofs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Claimants and finders can read proof photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'claim-proofs'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or exists (
        select 1 from public.listings l
        where l.id::text = (storage.foldername(name))[1]
          and l.user_id = auth.uid()
      )
    )
  );

-- ===== DEMO SEED =====
-- Ownerless sample listings so a fresh deploy isn't empty.
-- Photos are served from /public/images (storage_path prefix "demo/").

insert into listings (id, user_id, type, title, category, description, location_lat, location_lng, location_label, date_occurred, time_occurred, reward_amount, reward_currency, view_count, created_at, updated_at) values
  ('00000000-0000-4000-8000-000000000001', null, 'found', 'Blue compact umbrella', 'other',
   'Found a light blue compact umbrella with a wooden handle and red ball tip, left against a brick wall during a rain shower.',
   53.3454, -6.2672, 'Temple Bar, Dublin', '2026-05-20', null, null, 'GBP', 34, now() - interval '5 days', now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000002', null, 'found', 'Ornate brass key', 'other',
   'Found an old ornate brass key among the leaves near the park path. No keyring attached.',
   53.3567, -6.3271, 'Phoenix Park, Dublin', '2026-05-18', null, null, 'GBP', 58, now() - interval '7 days', now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000003', null, 'lost', 'Red Herschel backpack', 'bags',
   'Lost my red Herschel backpack in the mountains. Has 3 enamel badge pins on the front pocket and a water bottle holder on the side. Very sentimental.',
   53.2500, -6.3800, 'Dublin Mountains', '2026-05-22', '14:30', 50, 'GBP', 91, now() - interval '3 days', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000004', null, 'found', 'Beige baseball cap', 'other',
   'Found a lightly worn beige cotton baseball cap hanging on a railing near the shopping area. No obvious brand markings.',
   53.3415, -6.2596, 'Grafton Street, Dublin', '2026-05-23', null, null, 'GBP', 22, now() - interval '2 days', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000005', null, 'found', 'Gold Michael Kors watch', 'jewelry',
   'Found a gold-tone Michael Kors chronograph watch among fallen leaves. Working condition. Roman numeral dial.',
   53.3382, -6.2591, 'St. Stephen''s Green, Dublin', '2026-05-21', '11:00', null, 'GBP', 143, now() - interval '4 days', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000006', null, 'found', 'Black leather messenger bag', 'bags',
   'Found a black leather messenger bag left on a park bench. Contains what appears to be documents and a phone charger.',
   53.3394, -6.2526, 'Merrion Square, Dublin', '2026-05-24', '09:15', null, 'GBP', 67, now() - interval '1 day', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000007', null, 'lost', 'Black hiking backpack', 'bags',
   'Lost my black hiking backpack — Fjällräven style with brown leather tag and two side clips. Had hiking gear inside including a rain jacket and snacks.',
   53.1700, -6.1200, 'Wicklow Mountains', '2026-05-19', '15:00', 75, 'GBP', 112, now() - interval '6 days', now() - interval '6 days')
on conflict (id) do nothing;

insert into listing_photos (listing_id, storage_path, display_order)
select v.listing_id::uuid, v.storage_path, 0
from (values
  ('00000000-0000-4000-8000-000000000001', 'demo/umbrella.jpg'),
  ('00000000-0000-4000-8000-000000000002', 'demo/key.jpg'),
  ('00000000-0000-4000-8000-000000000003', 'demo/backpack-red.jpg'),
  ('00000000-0000-4000-8000-000000000004', 'demo/cap.jpg'),
  ('00000000-0000-4000-8000-000000000005', 'demo/watch.jpg'),
  ('00000000-0000-4000-8000-000000000006', 'demo/bag-bench.jpg'),
  ('00000000-0000-4000-8000-000000000007', 'demo/backpack-forest.jpg')
) as v(listing_id, storage_path)
where not exists (
  select 1 from listing_photos p where p.listing_id = v.listing_id::uuid
);
