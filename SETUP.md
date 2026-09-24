# FindLoop — Setup & Deployment

FindLoop runs on **Next.js 14 + Supabase** (Auth, Postgres, Storage) and deploys to **Vercel**.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the migrations **in order**:
   1. `supabase/migrations/00001_initial_schema.sql`
   2. `supabase/migrations/00002_rls_policies.sql`
   3. `supabase/migrations/00003_production_readiness.sql` (phone verification, reviews, view counts, private claim-proof bucket, demo listings)
3. **Authentication → URL Configuration**
   - Site URL: your production URL, e.g. `https://findloop.vercel.app`
   - Redirect URLs: add `https://findloop.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`,
     and (for preview deploys) `https://*-<your-team>.vercel.app/auth/callback`
4. Optional: in **Authentication → Emails**, set up custom SMTP. Supabase's built-in mailer is heavily rate-limited.

## 2. Environment variables

Copy `.env.local.example` to `.env.local` for local dev, and add the same keys in
**Vercel → Project → Settings → Environment Variables**:

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Server-only secret |
| `CRON_SECRET` | `openssl rand -hex 32` | Vercel Cron authenticates with it |
| `ADMIN_EMAILS` | comma-separated | Who can open `/admin` |
| `NEXT_PUBLIC_SITE_URL` | your prod URL | Used in email links. Falls back to the request host |

## 3. Deploy to Vercel

1. Push the repo to GitHub and **Import** it in Vercel (framework preset: Next.js, defaults are fine).
2. Add the environment variables above, then deploy.
3. `vercel.json` registers a daily cron job (`/api/claims/expire`) that expires pending claims older than 48h.
   Hobby plans only allow daily crons. On Pro you can change the schedule to hourly (`0 * * * *`).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm test
npm run build    # same build Vercel runs
```

## Notes

- **Phone verification is self-attested**: the number is stored privately (`profile_private`) and the
  account is marked verified with no SMS step. Swap in Supabase phone OTP before relying on it for trust.
- Listing photos live in the public `listing-photos` bucket. Claim proof photos live in the private
  `claim-proofs` bucket and are shown to the finder via short-lived signed URLs.
- Demo listings (seeded by `00003`) have no owner and use images from `public/images/`.
  Delete them with `delete from listings where user_id is null and id::text like '00000000-0000-4000-8000-%';`
