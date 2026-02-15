# Recommended Answers (Senior Engineer Baseline)

These are practical v1 decisions optimized for quality, speed, and free-tier constraints.

## Product Direction
1. Audience priority: high school students first, career switchers second.
2. Product feel: educational first, community second.
3. Route `/`: gateway page linking to `/1` to `/5` plus "recommended start" CTA.

## Brand and Voice
1. Working name: `RealJobScope`.
2. Tagline: `See what jobs are actually like.`
3. Tone: mixed, 70% factual and 30% energetic.
4. Anonymous testimonials: allowed but visually labeled as anonymous.

## Content Model
1. Mandatory fields:
- role title
- industry
- location (city/country or remote)
- work mode (onsite/hybrid/remote)
- years of experience
- what they do day-to-day
- best parts
- hardest parts
- recommendation to students
2. Salary: optional (region differences and sensitivity).
3. Media upload: text-only for v1.
4. Submission access: allow no-login submission with moderation.

## Moderation and Trust
1. Publish model: manual approval required for all submissions in v1.
2. Rejected submissions: notify only if contributor provided email.
3. Legal baseline:
- minimum age notice for submitters (13+ recommended policy text)
- remove personal/company-sensitive data
- no defamatory or unverifiable claims

## Design Preferences
1. Build order priority: `/1` (Career City) then `/3` (A Day In The Job).
2. Avoid colors: avoid purple-heavy palettes and low-contrast neon text.
3. Include colors: deep blue, warm orange, off-white neutrals, green accent.
4. Motion level: medium by default with strict reduced-motion support.

## Technical Constraints
1. Data/auth: Supabase free tier.
2. Build strategy: static-first UI with Supabase integration for submission + read APIs.
3. Language support: English-only v1, but keep content model locale-ready.

## Launch and Operations
1. Launch target: 6 weeks from project start.
2. Analytics: minimal privacy-safe analytics from day one (page views + CTA clicks).
3. Moderation ownership: one primary moderator + one backup.
4. Admin tooling: no custom admin panel in v1; moderate directly in Supabase table views.

## Final Decision Checklist
1. `/` behavior: gateway page to all concepts.
2. DB choice: Supabase free tier.
3. First two concepts: `/1` and `/3`.
4. Must-have fields: mandatory list above.
5. Timeline: 6-week v1 launch plan.
