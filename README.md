# JobScope

JobScope is a career-discovery website where students and early-career users can explore structured, real-world job stories.

## Implemented routes

- `/` Wall of Paths (primary homepage)
- `/4` alias redirect to `/`
- `/jobs` filterable directory
- `/jobs/[slug]` role detail page
- `/share` structured contribution form
- `/staff/moderation` moderator queue UI (Supabase Auth + whitelist, unlinked from public nav)
- `/moderation` compatibility redirect to `/staff/moderation`
- `/api/share` submission endpoint (`pending` by default)
- `/api/moderate` moderator approve/reject endpoint
- `/api/events` privacy-safe funnel events endpoint
- `/robots.txt`, `/sitemap.xml` SEO crawl surfaces
- `/about`, `/guidelines`

## Stack

- Astro + TypeScript
- Vercel adapter configured
- Zod schema validation
- Vitest unit/integration tests
- ESLint + Prettier formatting

## Development

```sh
npm install
npm run dev
```

## Quality commands

```sh
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

## Supabase setup (required for real moderation)

1. Create a Supabase project.
2. Run this SQL in Supabase SQL Editor:

```sql
create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'profile_status'
  ) then
    create type public.profile_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.job_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  role_title text not null,
  industry text not null,
  seniority text not null,
  location text not null,
  work_mode text not null check (work_mode in ('onsite', 'hybrid', 'remote')),
  salary_range text,
  education_path text,
  day_to_day text not null,
  tools_used text[] not null default '{}',
  best_parts text not null,
  hardest_parts text not null,
  recommendation_to_students text not null,
  years_experience int not null check (years_experience between 0 and 50),
  submitter_type text not null check (submitter_type in ('anonymous', 'public')),
  contact_email text,
  status public.profile_status not null default 'pending',
  review_notes text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  job_profile_id uuid not null references public.job_profiles(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action text not null check (action in ('approve', 'reject')),
  old_status public.profile_status not null,
  new_status public.profile_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  session_id text,
  client_fingerprint text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_profiles_status_created_at
on public.job_profiles(status, created_at desc);

create index if not exists idx_job_profiles_slug
on public.job_profiles(slug);

create index if not exists idx_moderation_events_profile_created_at
on public.moderation_events(job_profile_id, created_at desc);

create index if not exists idx_analytics_events_event_created_at
on public.analytics_events(event_name, created_at desc);

alter table public.job_profiles enable row level security;

drop policy if exists "read approved" on public.job_profiles;
create policy "read approved"
on public.job_profiles for select
using (status = 'approved');

drop policy if exists "insert pending" on public.job_profiles;
create policy "insert pending"
on public.job_profiles for insert
to anon, authenticated
with check (
  status = 'pending'
  and approved_at is null
  and approved_by is null
);
```

3. Copy `.env.example` to `.env` and set:

   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `MODERATOR_EMAILS` (comma-separated, e.g. `you@email.com`)
   - Optional: `SHARE_RATE_LIMIT_MAX` (default `8`)
   - Optional: `SHARE_RATE_LIMIT_WINDOW_MS` (default `600000`)

4. Create moderator users in Supabase Auth using those emails.
5. Open `/staff/moderation`, sign in via magic link, approve/reject pending submissions.

## SQL editor helpers

- `supabase/seed_test_jobs.sql`: upserts 10 approved sample jobs for testing.
- `supabase/reset_tables.sql`: clears `job_profiles`, `moderation_events`, and `analytics_events`.

## Notes

- Submissions are accepted without login and stored as `pending`.
- `/api/share` uses honeypot + rate limiting + duplicate detection before enqueue.
- Jobs directory now supports compare mode, expanded filters, and pagination.
- Header includes a persistent palette toggle (Sand/Coastal/Graphite) backed by semantic theme tokens.
- Moderation supports filtered queue views, metrics, and bulk actions.
- If Supabase env vars are missing in production, `/api/share` returns `503` until storage is configured.
- Local fallback storage is only available in dev/test mode.
- Homepage and jobs directory use deferred server rendering with skeleton fallbacks while waiting for DB data.
- Seed data includes 20 approved job profiles for demo and testing.
- If building from a Windows-mounted path (for example `/mnt/c/...` in WSL), Vercel adapter copy steps may hit `EPERM`; build from a native Linux path (for example `/tmp/...`) to validate packaging.
