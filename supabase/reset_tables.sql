-- WARNING: This removes all data from RealJobScope app tables.
-- Run in Supabase SQL Editor only when you intentionally want a clean slate.

begin;

truncate table public.moderation_events;
truncate table public.analytics_events;
truncate table public.job_profiles restart identity cascade;

commit;
