# ALX Polly

A modern polling application built with Next.js (App Router) and Supabase. Registered users create/manage polls and share them via link or QR; everyone can vote and view results.

## Tech Stack
- Next.js (App Router)
- React 19
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS 4

## Features
- Authentication (Supabase)
  - Register (username, email, password), email verification notice
  - Login / Logout
  - Profile: update username, change password (old password required)
- Polls (Supabase)
  - Create, Edit, Delete
  - Options (2+); per-option voting
  - Require-login toggle to gate voting
  - Public toggle (`is_public`) to appear on Explore
  - Optional end date
- Voting
  - Public poll pages; optional login enforcement
  - Auth users: 1 vote per poll (DB constraint)
  - Anonymous users: allowed if poll does not require login
- Sharing
  - Direct link + QR code on poll and results pages
- Explore
  - Public listing of polls with `is_public = true`

## Architecture
- App Router with client components where interactivity is required (auth state, voting).
- Supabase browser client for auth and database operations.
- Row Level Security (RLS) ensures creators can only modify their own polls/options.

## Setup
1) Requirements
- Node 20+
- Supabase project

2) Environment
Create `alx-polly/alx-polly/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3) Install & Run (from the app directory)
```
cd alx-polly/alx-polly
npm install
npm run dev
```
Open http://localhost:3000

## Database (Supabase)
Schema overview:
- `profiles(id, username, created_at)` – mirrors `auth.users.id`; RLS enabled
- `polls(id, author_id → profiles.id, title, description, allow_multiple, require_login, created_at, ends_at, is_public)`; RLS enabled
- `poll_options(id, poll_id → polls.id, label, position)`; RLS enabled
- `votes(id, poll_id → polls.id, option_id → poll_options.id, voter_id → profiles.id, created_at)`; RLS enabled
- Index: unique vote per poll for authenticated users: `unique (poll_id, voter_id) where voter_id is not null`


RLS policy checklist (summary):
- polls: SELECT (public), INSERT/UPDATE/DELETE only when `author_id = auth.uid()`
- poll_options: SELECT (public), ALL only when parent poll’s `author_id = auth.uid()`
- votes: SELECT (public), INSERT (authenticated) with `voter_id = auth.uid()`, and INSERT (anon) only when poll `require_login = false`

Troubleshooting:
- If you add columns and the API can’t see them: run `notify pgrst, 'reload schema';` or restart the API (Settings → API).
- Ensure RLS is enabled on all four tables and policies exist; missing policies will block writes.

## Routes
- `/` – Landing page (hero + CTAs)
- `/explore` – Public polls (is_public = true)
- `/polls` – Your polls (login prompt if not authenticated)
- `/create-poll` – Create (authenticated)
- `/polls/[id]` – Vote (public; enforces require-login when enabled)
- `/polls/[id]/results` – Results (counts, percentages, QR)
- `/polls/[id]/edit` – Edit (author only)
- `/login`, `/register`, `/profile`

## User Roles
- Poll Creator (registered): create/edit/delete polls, set visibility, share, view results
- Voter (registered or anonymous): open poll via link/QR, cast vote (login enforced if creator enabled)

## Deployment (Vercel)
1) Import the project; set Project Root to `alx-polly/alx-polly`.
2) Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional `NODE_VERSION=20` (also set in `package.json` engines)
3) Build settings:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `.next`
4) Add your production domain to Supabase Auth redirect URLs.
5) Deploy.

## Notes
- Explore lists only polls with `is_public = true`.
- Dashboard filters to the current user’s polls.
- Authenticated duplicate votes blocked at DB; anonymous best-effort.
- QR codes are generated via a public image service.

## License
MIT
