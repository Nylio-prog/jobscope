# JobScope V2 Plan

Last updated: 2026-02-13
Status: Draft for planning (no implementation in this document)

## 1) Assumptions, Risks, Dependencies

### Assumptions
- Keep core stack: Astro + TypeScript + Supabase + Vercel.
- Keep human-in-the-loop moderation as the trust model.
- Continue with student/career-switcher audience as primary focus.
- V2 should remain incremental and backward-compatible with current URLs where possible.

### Risks
- Scope expansion can delay high-impact fixes (trust + reliability).
- New anti-spam or auth controls can add submission friction.
- Schema changes for moderation/audit can break existing tools if not migrated carefully.
- UI refresh work can create inconsistency if design tokens are not systematized first.

### Dependencies
- Supabase schema migrations (new indexes, moderation audit tables, optional contributor profile fields).
- CI/CD setup (GitHub Actions or equivalent).
- Analytics/error-monitoring choice (privacy-safe + low overhead).
- Product decisions on anonymous vs verified contribution weighting.

## 2) Current V1 Gaps To Address

1. Discovery depth is limited.
- Directory filters are limited to keyword, industry, work mode, and sort.
- No compare flow, no saved shortlist, and no pagination strategy for growth.

2. Trust/safety controls are basic.
- Submission moderation heuristics are simple phrase/link checks.
- No explicit API rate limiting, anti-bot challenge, or duplicate-submission detection.

3. Moderation operations do not scale well.
- Queue supports single-item actions but lacks bulk workflows, risk-first ordering, and audit history views.

4. Reliability and observability are thin.
- Missing CI pipeline for automated lint/typecheck/test/build on PRs.
- No structured app-level telemetry for submission funnel drop-off or moderation throughput.
- Local fallback behavior is useful in development but can hide production misconfiguration if not guarded.

5. Design extensibility is limited.
- Styling tokens exist, but theme/palette switching is not a first-class system.
- Component-level visual consistency can drift as pages evolve.

6. Testing coverage can be broader.
- Good unit/integration coverage exists for schema and submission API basics.
- Gaps remain in moderation API behavior, auth-edge cases, and end-to-end journey tests.

## 3) V2 Goals (Outcome-Oriented)

### Product Goals
- Improve job-discovery decision quality and speed.
- Increase high-quality submissions while reducing moderation burden.
- Make moderation reliable for larger submission volume.
- Make visual system easier to evolve (including future palette changes).

### Suggested Success Metrics
- +25% increase in directory-to-detail click-through rate.
- +20% increase in successful submission completion rate.
- -40% moderation time per approved submission.
- <1% API failure rate on `/api/share` and `/api/moderate`.
- 90th percentile API latency under 500ms for core read paths.

## 4) V2 Workstreams and Priorities

## WS-A (P0): Discovery UX and Information Architecture

### Scope
- Expand filters: seniority, years experience bands, location region, optional salary availability.
- Add compare mode (2-3 roles side-by-side).
- Add result pagination or cursor-based loading for large catalogs.
- Improve no-results UX with quick reset and suggested alternatives.
- Add "related roles" on job detail pages.

### Why
- Current browsing works for small datasets but will degrade as inventory grows.
- Better comparison support is directly aligned with student decision-making.

### Acceptance Criteria
- All filters are URL-backed and shareable.
- Compare view works on desktop and mobile.
- Discovery flow remains fast with 1,000+ approved entries.

## WS-B (P0): Submission Quality and Abuse Prevention

### Scope
- Add rate limiting per IP + user agent + rolling window on `/api/share`.
- Add bot friction (honeypot + optional Turnstile/reCAPTCHA fallback).
- Add duplicate/near-duplicate submission checks (role + normalized body similarity).
- Add validation hardening (trim/normalize whitespace, reject empty tool arrays after transform).
- Add submission "preview before send" for higher-quality input.

### Why
- Prevent low-quality and automated spam before it reaches moderators.
- Improve signal quality and reduce manual moderation load.

### Acceptance Criteria
- Abuse attempts are blocked with meaningful client messages.
- False-positive rejection rate stays low (monitoring target required).
- Moderator queue receives fewer low-signal entries.

## WS-C (P0): Moderation Workflow and Auditability

### Scope
- Add moderation filters: oldest/newest, flagged-first, industry, submitter type.
- Add bulk actions for reject/approve with required review reason presets.
- Store moderation decision history (who, when, old/new status, notes).
- Add queue KPIs: pending count by age bucket, average review time.
- Add safer moderation UI states (optimistic UI with rollback on error).

### Why
- Current per-item workflow is viable at low volume only.
- Audit trail is required for operational trust and post-incident review.

### Acceptance Criteria
- Moderators can process at least 3x current throughput without usability regressions.
- All status changes are auditable.

## WS-D (P1): Design System and Theme Architecture

### Scope
- Convert visual tokens into semantic layers:
  - `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-accent`, etc.
- Create at least 2 palette presets (default + alternate) behind a config switch.
- Standardize component spacing, elevation, border, and radius tiers.
- Unify interactive states (hover/focus/active/disabled) with accessibility checks.

### Why
- You already anticipate palette updates; V2 should make that low-risk and fast.
- A semantic system prevents per-page style drift.

### Acceptance Criteria
- Palette swap requires token changes only (no per-page rewrites).
- Contrast meets WCAG AA for text and controls in all supported themes.

## WS-E (P0): Reliability, Performance, and Observability

### Scope
- Add CI pipeline for lint/typecheck/test/build on every PR.
- Add structured server logs for API errors and moderation events.
- Add basic privacy-safe analytics funnel:
  - homepage -> jobs -> detail -> share start -> share submit success.
- Add DB indexes for dominant access patterns:
  - `status`, `created_at`, `slug`, and common moderation filters.
- Add caching strategy for approved listings/detail reads where safe.

### Why
- Reliability work reduces regressions and gives faster root-cause analysis.
- Data is needed to prioritize post-V2 improvements.

### Acceptance Criteria
- CI blocks merges on failing quality checks.
- Critical API errors are visible with actionable context.
- Query latency stays stable as data grows.

## WS-F (P1): Content Strategy and Growth

### Scope
- Add curated role collections (for example: "Healthcare Starter Paths", "Remote-friendly Entry Roles").
- Add editorial quality scoring rubric for published stories.
- Add basic SEO enhancements:
  - sitemap/robots checks
  - richer metadata per job detail
  - structured data where appropriate
- Add "last reviewed" metadata for content freshness.

### Why
- Stronger information scent improves discoverability and repeat visits.
- Editorial quality controls improve trust.

### Acceptance Criteria
- Collections produce measurable engagement lift.
- SEO baseline checks pass in build-time validation.

## 5) Phased Delivery Plan

## Phase 0: V2 Foundations (1-2 weeks)
- Confirm KPIs and prioritization.
- Finalize schema migration plan.
- Add CI and baseline observability scaffolding.

## Phase 1: Trust + Moderation Core (2-3 weeks)
- Ship rate limiting, anti-bot controls, and duplicate checks.
- Ship moderation filters + audit events + safer status update UX.

## Phase 2: Discovery Upgrade (2-3 weeks)
- Expand filters + related roles + no-result recovery.
- Deliver compare mode and pagination/cursor strategy.

## Phase 3: Design System Hardening (1-2 weeks)
- Introduce semantic tokens and at least one alternate palette.
- Normalize interactive states and accessibility checks.

## Phase 4: Growth and Optimization (ongoing)
- Add curated collections and richer metadata.
- Iterate using analytics and moderation throughput data.

## 6) Technical Design Notes (High-Level)

1. Data model additions (proposed)
- `moderation_events` table:
  - `id`, `job_profile_id`, `actor_user_id`, `action`, `old_status`, `new_status`, `note`, `created_at`
- Optional `quality_score` and `last_reviewed_at` fields on `job_profiles`.
- Optional denormalized search fields for faster filtering if needed.

2. API evolution
- Keep existing endpoints for compatibility.
- Add optional query params and response metadata:
  - pagination cursors
  - filter facets counts
  - moderation queue summary

3. Backward compatibility
- Preserve `/jobs`, `/jobs/[slug]`, `/share`, `/staff/moderation` routes.
- Keep existing payload fields supported while adding non-breaking fields.

## 7) Validation and QA Plan

### Automated
- Unit tests: normalization, duplicate detection, moderation scoring.
- API tests: rate limiting behavior, moderation authorization edge cases, pagination.
- E2E tests (Playwright recommended): visitor discovery path + share submission + moderator approval.
- Performance checks: list/detail response timing and build artifact size changes.

### Manual
- Accessibility pass: keyboard-only flow, focus order, forms, and error messaging.
- Mobile UX pass: filters, compare mode, moderation interface readability.
- Content QA pass: published story quality rubric spot-check.

## 8) Release and Rollback Strategy

1. Feature flags
- Gate high-risk modules (compare mode, anti-bot strictness, bulk moderation actions).

2. Migration sequencing
- Deploy additive schema migrations first.
- Deploy read-compatible app changes second.
- Enable write paths/features last.

3. Rollback
- Keep old moderation/listing paths functional during rollout.
- Disable new feature flags without requiring schema rollback.

## 9) Open Product Decisions

1. Should anonymous submissions remain equal in ranking to public submissions?
2. What abuse-prevention friction is acceptable before submission drop-off is too high?
3. Do we prioritize compare mode or saved shortlists first?
4. Should moderation reasons be visible publicly on rejected content resubmissions (if resubmission is enabled)?
5. Do we want multilingual support in V2 or defer to V3?

## 10) Recommended First Three Tickets

1. `P0` Add CI pipeline + baseline telemetry for `/api/share` and `/api/moderate`.
2. `P0` Implement submission rate limiting + honeypot + duplicate detection.
3. `P0` Add moderation audit events and queue filters (flagged-first + age-based).
