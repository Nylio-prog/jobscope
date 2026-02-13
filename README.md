# JobScope v1

JobScope is a career-discovery website where students and early-career users can explore structured, real-world job stories.

## Implemented v1 routes

- `/` Wall of Paths (primary homepage)
- `/4` alias redirect to `/`
- `/jobs` filterable directory
- `/jobs/[slug]` role detail page
- `/share` structured contribution form
- `/moderation` moderator queue UI (Supabase Auth + whitelist)
- `/api/share` submission endpoint (`pending` by default)
- `/api/moderate` moderator approve/reject endpoint
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

create type public.profile_status as enum ('pending', 'approved', 'rejected');

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

4. Create moderator users in Supabase Auth using those emails.
5. Open `/moderation`, sign in via magic link, approve/reject pending submissions.

## Notes

- Submissions are accepted without login and stored as `pending`.
- If Supabase env vars are missing, submission API falls back to local-dev mode (for tests/dev only).
- Seed data includes 20 approved job profiles for demo and testing.
- If building from a Windows-mounted path (for example `/mnt/c/...` in WSL), Vercel adapter copy steps may hit `EPERM`; build from a native Linux path (for example `/tmp/...`) to validate packaging.
