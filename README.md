# FindLoop

Community lost & found: post lost or found items, get automatic matches, and verify ownership through claims.

**Stack:** Next.js 14 (App Router) · Supabase (Auth, Postgres + RLS, Storage) · Vercel

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys
npm run dev
```

For Supabase setup, migrations and Vercel deployment, see **[SETUP.md](SETUP.md)**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build (what Vercel runs) |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
