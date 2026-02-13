# Job Discovery Website - Project Plan (Phase 0)

## 1) Vision
Build a public website where people can share real job experiences so students and early-career users can understand what jobs are actually like in the real world.

This first version will include:
- A core "share your job story" flow.
- A browsable library of job entries.
- Five radically different homepage designs at `/1`, `/2`, `/3`, `/4`, and `/5`.
- Deployment on Vercel free tier.
- Only free/open technologies in the initial build.

## 2) Product Goals
- Show realistic, practical job insights beyond school stereotypes.
- Make content easy to scan by role, industry, and lifestyle factors.
- Encourage contributors to submit useful, structured job stories.
- Keep trust high via moderation rules and transparent contributor framing.

## 3) Non-Goals (for v1)
- No paid SaaS dependencies.
- No advanced AI ranking pipeline in v1.
- No enterprise admin tooling.
- No native mobile app.

## 4) Target Users
- High school students exploring options.
- Career switchers.
- Parents/mentors/counselors.
- Working professionals who want to share experience.

## 5) Core User Stories
- As a student, I can quickly understand what a role does day-to-day.
- As a visitor, I can filter jobs by interests, salary band, and work style.
- As a contributor, I can submit my job profile with recommendations.
- As a moderator, I can review submissions before publishing.

## 6) Recommended Stack (Free Tier Friendly)
- Framework: Astro + TypeScript.
- Styling: CSS variables + custom component styles (no generic template look).
- Hosting: Vercel (Hobby/free).
- Database/Auth (recommended): Supabase free tier.
- Content validation: Zod.
- Optional analytics: Plausible self-hosted later, or simple privacy-safe event logging in Supabase.

Why this stack:
- Astro gives strong performance for content-heavy pages.
- Vercel deploys Astro cleanly on free tier.
- Supabase free tier covers DB + auth without paid commitment.

## 7) Information Architecture
- `/` = entry router page that introduces the project and links to design variants.
- `/1` = Homepage Concept 1.
- `/2` = Homepage Concept 2.
- `/3` = Homepage Concept 3.
- `/4` = Homepage Concept 4.
- `/5` = Homepage Concept 5.
- `/jobs` = job directory.
- `/jobs/[slug]` = job detail page.
- `/share` = contribution form.
- `/about` = mission and methodology.
- `/guidelines` = submission and moderation policy.

## 8) Data Model (v1)
`JobProfile`
- id
- roleTitle
- industry
- seniority
- location
- workMode (onsite/hybrid/remote)
- salaryRange (optional)
- educationPath
- dayToDay
- toolsUsed
- bestParts
- hardestParts
- recommendationToStudents
- yearsExperience
- submitterType (anonymous/public)
- createdAt
- approvedAt
- status (pending/approved/rejected)

`Tag`
- id
- name
- category (industry, skill, lifestyle, education)

`JobProfileTag`
- jobProfileId
- tagId

## 9) Five Creative Homepage Concepts

### Concept `/1`: "Career City"
- Visual metaphor: an illustrated city where each district is a sector.
- Interaction: hover/click districts to preview real jobs from that sector.
- Style: editorial poster + map labels + layered parallax.
- Mood: optimistic, exploratory, discovery-first.

### Concept `/2`: "Orbit of Work"
- Visual metaphor: radial solar system where roles orbit by similarity.
- Interaction: drag/scroll through role clusters and open role snapshots.
- Style: dark-noir with neon accents and precise data marks.
- Mood: futuristic and high-contrast.

### Concept `/3`: "A Day In The Job"
- Visual metaphor: vertical narrative timeline from morning to evening.
- Interaction: scroll-driven scene changes with embedded role stories.
- Style: cinematic panels with bold type and scene transitions.
- Mood: immersive and story-centric.

### Concept `/4`: "Wall of Paths"
- Visual metaphor: collage wall with cards, notes, badges, and stickers.
- Interaction: filter cards and reshuffle masonry grid.
- Style: tactile, scrapbook-like, youth-friendly visual language.
- Mood: creative and approachable.

### Concept `/5`: "Mission Control"
- Visual metaphor: control-room dashboard for labor market exploration.
- Interaction: live-feeling panels, trend chips, and quick compare cards.
- Style: brutalist data UI with strong typography and graph motifs.
- Mood: analytical and practical.

## 10) Shared UX Requirements Across All Five
- Immediate explanation of "what this site is" above the fold.
- Clear call-to-action to browse jobs and share a story.
- At least one social-proof module (real contributor count, featured stories).
- Accessibility baseline: keyboard nav, semantic landmarks, color contrast.
- Fast load target on mobile.

## 11) Content and Trust Strategy
- Require structured fields so submissions are useful.
- Show "how this was collected" transparency section.
- Support anonymous submission option with moderation.
- Publish clear community rules and anti-misinformation policy.

## 12) Performance and Accessibility Targets
- Lighthouse target: Performance >= 90 on mobile for homepage variants.
- CLS minimized by fixed media sizing.
- Respect reduced motion preference.
- WCAG AA contrast for primary text actions.

## 13) Security and Moderation (v1 practical scope)
- Server-side validation for all submissions.
- Simple profanity/spam checks before moderation queue.
- Admin-only approval endpoint protected by auth.
- Rate limit submission endpoint.

## 14) Delivery Phases
- Phase A: Alignment, schema, and content shape.
- Phase B: Astro project scaffold + shared design system primitives.
- Phase C: Build five homepage variants (`/1`..`/5`).
- Phase D: Build submission and directory flows.
- Phase E: QA, performance tuning, and launch on Vercel.

## 15) Definition of Done for "Plan Complete"
- Architecture and route map approved.
- Database/auth choice approved.
- Brand direction and tone approved.
- At least one seed content pack ready.
- Build order agreed for the five variants.
