# FindLoopLocal — Local Dev Setup

This is a **no-external-services** copy of FindLoop for local testing.
No Supabase account, no database, no storage bucket required.

## Start the app

```bash
node node_modules/next/dist/bin/next dev
```

App runs at **http://localhost:3000**

## Create accounts

Go to [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) and sign up.
No email confirmation — you are logged in immediately after signing up.

## How data is stored

- All data (users, listings, claims, matches) is kept in memory and also written to **`.local-data.json`** so it survives server restarts.
- Uploaded photos are saved to **`public/uploads/`** and served at `/uploads/...`.
- Both are in `.gitignore` and will not be committed.

## Reset all data

```bash
rm -f .local-data.json
rm -rf public/uploads/*
```

## Running tests

```bash
npm test
```

## Notes

- `.bin/` symlinks may be broken on Node 24 — use `node node_modules/next/dist/bin/next` directly
- Passwords stored in plaintext — local dev only, never deploy this variant
- Forgot-password shows the "Email sent" state but does not actually send email
- The admin page is accessible to any logged-in user (no role check in local mode)
- Photo blur is client-side — originals never leave the device unblurred
- Smart match runs automatically when a listing is created
