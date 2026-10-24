# Development Plan: Maths Reminder App

## Scope & Goals

- Build a responsive Next.js (App Router) SPA with light theme: navbar, search, grade filter, cards grid (hover shadow), modal with print/download, and responsive breakpoints (laptop 4 cards, tablet 2-3, phone 1).
- Roles: anonymous users (view/print/download); admin (email/password login, change password) with add/edit/delete cards, view storage usage, view visit count.
- Data: Lessons with title (<=50 words), description, grade (6-9), PDF asset, created/updated timestamps.
- Deployable on Netlify free plan; Supabase used for auth, database, storage, and simple visit counting.

## Architecture

- Frontend: Next.js 16 App Router, React 19, Tailwind CSS v4. Components for layout (navbar), search/filter bar, card grid, card modal, admin dialogs/forms, auth banner/button.
- Backend services: Supabase client (publishable + secret keys via env), tables and storage bucket. All data access via Supabase JS client in server actions/route handlers where needed.
- Data model (Supabase):
  - `lessons` table: id (uuid), title (text), description (text), grade (int), pdf_path (text), created_at/updated_at (timestamptz), created_by (uuid nullable).
  - `visits` table (or `metrics` key/value): id (bigint), visited_at (timestamptz default now()). Simple count of rows for total visits.
  - Storage bucket `lesson_pdfs` for PDFs. RLS: public read for PDFs; insert/update/delete restricted to admin role.
  - Auth: email/password; admin users manually provisioned; optional `user_roles` table mapping user_id -> role = 'admin'. RLS policies enforce only admin writes.

## Key Features & Flows

- Anonymous experience: view/search by title (includes grade filter), responsive card grid, hover shadow, modal with X/Print/Download; print triggers `window.print()`, download uses signed/public URL.
- Admin experience: subtle login button; after login, inline controls on cards (edit/delete) and global "+" to add card. Forms validate required fields and 50-word title cap. Show storage usage and visit count in admin panel/toolbar.
- Search/filter: client-side query over fetched lessons; optional server-side query by title/grade.

## Pages/Components (app directory)

- `app/layout.tsx`: global layout, fonts, theme (light only), Supabase provider.
- `app/page.tsx`: main page with navbar, search/filter, card grid, modal, admin controls.
- Components (in `app/(components)/`): Navbar, SearchBar, GradeChips, CardGrid/Card, CardModal, AdminBar (login/status, metrics), LessonForm (add/edit), ConfirmDialog.
- Utilities: `lib/supabaseClient.ts`, `lib/types.ts`, `lib/validators.ts` (zod), `lib/metrics.ts` (visit logging), `lib/storage.ts` helpers.

## Auth & Security

- Use Supabase auth; session stored via Supabase client. Admin role check via `user_roles` table or Supabase custom claim; frontend gates edit/delete/add controls. RLS ensures only admin can write `lessons` or storage, public can read.
- Environment vars for Netlify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable), `SUPABASE_SERVICE_ROLE` not used in client; rely on RLS.

## Metrics & Storage Usage

- Visits: on page load, call server action/route to insert into `visits`; display count via aggregate query. Free and simple.
- Storage usage: sum of file sizes from `lesson_pdfs` via Supabase storage API.

## Deploy

- Netlify build: `npm run build`; set `NETLIFY_NEXT_PLUGIN_SKIP` if needed, but default Next on Netlify. Env vars configured in Netlify UI. Supabase bucket public access for PDFs or signed URLs.

## Testing & Quality

- Lint with `npm run lint`. Add minimal unit tests for utils if time. Manual validation: search, modal, print/download, admin CRUD, RLS access patterns.

## Files to Add/Update (root paths)

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css` (implement UI, styling).
- `app/(components)/*` for UI pieces and admin forms/modals.
- `lib/supabaseClient.ts`, `lib/types.ts`, `lib/validators.ts`, `lib/metrics.ts`, `lib/storage.ts`.
- `netlify.toml` if needed for deploy config.
- `.env.local.example` for required env vars.
- `DEV_PLAN.md` (this plan) in repo root.

## Implementation Todos

- setup-supabase: Wire Supabase client, types, RLS notes, env samples.
- build-ui: Implement layout, search/filter, cards, modal, responsive grid.
- admin-crud: Admin login flow, add/edit/delete forms, PDF upload to storage.
- metrics-storage: Visit counter integration and storage usage display.
- deploy-netlify: Add deploy config/env docs and verify build steps.
