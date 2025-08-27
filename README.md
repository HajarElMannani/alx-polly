# ALX Polly

A Next.js App Router polling application with Supabase authentication. Users can create, share, vote, and view results for polls.

## Features

- Poll Management (creator)
  - Create, edit, delete polls
  - Dashboard of your polls
  - Author stored (id and display name)
- Voting
  - Public poll pages at `/polls/[id]`
  - Per-option voting with duplicate-vote prevention (localStorage + user id)
  - Optional: require login to vote
- Results
  - `/polls/[id]/results` shows counts and percentages
  - Share link + QR code for the poll link
- Auth (Supabase)
  - Registration with username, email, password (email verification notice)
  - Login, Logout, Profile (update username, change password with old password check)
- UI
  - Global navbar across pages

## Requirements

- Node.js 20+
- Supabase project (for auth)

## Environment

Create `.env.local` in the app root (the folder that contains `package.json`) with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Restart the dev server after setting env vars.

## Install & Run

```bash
npm install
npm run dev
```

App runs at http://localhost:3000

## Setup

1) Node.js 20
- Ensure Node 20 is active. If you use nvm:
  - `nvm use` (an `.nvmrc` is provided) or `nvm install 20 && nvm use 20`.

2) Supabase project
- Create a new project at `https://app.supabase.com`.
- Go to Project Settings → API and copy:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- In Authentication → URL configuration, add these redirect URLs:
  - `http://localhost:3000`
  - Your production domain (when deployed)

3) Environment variables
- Create `.env.local` with the two keys above in the app root.
- Restart your dev server after changes.

4) First run
- Start the app: `npm run dev`.
- Visit `/register` to create an account, then login at `/login`.
- Create your first poll at `/create-poll`.

## Deployment

### Vercel (recommended)
1) Import the repository in Vercel.
2) Set the Project Root to the directory that contains this app’s `package.json`.
3) Set Environment Variables in Vercel → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optionally `NODE_VERSION=20` (Vercel also respects `engines.node` from `package.json`).
4) Build & Output
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`
5) Add your production domain to Supabase Authentication redirect URLs.
6) Deploy.

### Other platforms
- Any Node hosting that supports Next.js App Router should work.
- Ensure Node 20+, set the two Supabase env vars, and run `npm run build` then `npm start`.

## Key Scripts

- `npm run dev` – start dev server
- `npm run build` – build
- `npm run start` – start production server
- `npm run lint` – biome check
- `npm run format` – biome format

## App Structure (important routes)

- `/` → redirects to `/polls`
- `/polls` → dashboard (shows current user's polls if logged in)
- `/create-poll` → create a poll (protected)
- `/polls/[id]` → vote page (public), optional login required based on poll setting
- `/polls/[id]/results` → results page with counts/percentages and QR code
- `/polls/[id]/edit` → edit poll (author only)
- `/login` → login page
- `/register` → registration page
- `/profile` → profile (view email, update username, change password)

## Storage Notes

This demo uses localStorage as a backend stub for polls:
- Polls are saved in the browser and are not shared across devices.
- Voting prevention uses both localStorage and the authenticated user id.
- For production, replace `lib/storage.ts` with real API/database calls.

## Known Limitations

- Editing options resets vote counts if the number of options changes.
- Duplicate-vote prevention is best-effort on the client.
- QR is generated via a public image API for convenience.

