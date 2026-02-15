-- WARNING: This removes all data from JobScope app tables.
-- Run in Supabase SQL Editor only when you intentionally want a clean slate.

begin;

truncate table if exists public.moderation_events;
truncate table if exists public.analytics_events;
truncate table if exists public.job_profiles restart identity cascade;

commit;
