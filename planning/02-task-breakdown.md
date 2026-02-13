# Task Breakdown - Execution Backlog

## Phase 0 - Product Alignment
1. Confirm target audience priority order.
2. Confirm content policy and moderation scope.
3. Confirm launch geography and language.
4. Approve selected stack and free-tier services.
5. Freeze v1 feature scope.

Acceptance criteria:
- Written decisions captured for all 5 items.
- Any undecided item marked with owner and due date.

## Phase 1 - Project Setup
1. Initialize Astro project with TypeScript.
2. Configure linting and formatting.
3. Add global style tokens (color, spacing, typography scales).
4. Create base layout with SEO metadata helpers.
5. Add route shells: `/`, `/1`, `/2`, `/3`, `/4`, `/5`, `/jobs`, `/share`.

Acceptance criteria:
- App runs locally.
- Routes resolve successfully.
- Shared style tokens are used by at least one sample component.

## Phase 2 - Data and Content Foundation
1. Define `JobProfile` schema in code (Zod + DB model).
2. Create seed dataset (20-30 diverse job stories for prototype).
3. Build content adapters so all five homepages can consume same data.
4. Create category/tag taxonomy.

Acceptance criteria:
- Seed data validates against schema.
- At least 3 industries and 3 seniority levels represented.
- Same dataset can render key blocks on all five designs.

## Phase 3 - Shared Components
1. Build reusable CTA blocks.
2. Build job preview card component variants.
3. Build filter chips and quick stats module.
4. Build testimonial/recommendation module.
5. Build footer with mission and contribution links.

Acceptance criteria:
- Components render in isolation and on at least one page.
- Keyboard focus styles are visible.
- Mobile layouts do not overflow horizontally.

## Phase 4 - Homepage Variant `/1` (Career City)
1. Design visual map system and district legend.
2. Implement district interaction and preview drawer.
3. Add hero narrative and core CTA.
4. Add responsive fallback for small screens.
5. Optimize animation for reduced motion users.

Acceptance criteria:
- Interactive district previews work with keyboard and mouse.
- Mobile view remains understandable without map complexity.

## Phase 5 - Homepage Variant `/2` (Orbit of Work)
1. Implement radial cluster layout.
2. Build role orbit interaction model.
3. Add focused info panel for selected role.
4. Add transition and hover states.
5. Build touch-device behavior fallback.

Acceptance criteria:
- Cluster interaction works for pointer and touch.
- Text remains readable at all breakpoints.

## Phase 6 - Homepage Variant `/3` (A Day In The Job)
1. Build scroll chapters (morning, midday, evening, reflection).
2. Connect chapters to real job snippets.
3. Add timeline nav and jump links.
4. Tune animation pacing and section transitions.
5. Add reduced-motion static mode.

Acceptance criteria:
- Timeline is navigable via keyboard and anchor links.
- Story sections render with acceptable performance on mobile.

## Phase 7 - Homepage Variant `/4` (Wall of Paths)
1. Build masonry/collage layout engine.
2. Add drag-like card movement cues (non-essential enhancement).
3. Implement filter and reshuffle interactions.
4. Add visual badges for industries and work modes.
5. Create compact layout for phone screens.

Acceptance criteria:
- Filtering updates cards correctly.
- No layout breakage across major viewport widths.

## Phase 8 - Homepage Variant `/5` (Mission Control)
1. Build dashboard grid architecture.
2. Add quick-compare widgets for jobs.
3. Add trends strip and recommendation snapshots.
4. Create strong typographic hierarchy and data motifs.
5. Ensure readable high-density UI on mobile.

Acceptance criteria:
- Primary actions are discoverable in first viewport.
- Compare widgets are usable on touch devices.

## Phase 9 - Submission + Directory
1. Build `/share` form with validation.
2. Add anonymous/public contributor options.
3. Add moderation status pipeline.
4. Build `/jobs` list with filters.
5. Build `/jobs/[slug]` detail page.

Acceptance criteria:
- Valid submissions reach storage.
- Invalid submissions show clear error states.
- Directory filtering works by at least industry + work mode.

## Phase 10 - Quality and Launch
1. Cross-browser QA (Chrome, Edge, Safari baseline checks).
2. Accessibility review (keyboard flow + contrast + semantics).
3. Performance passes and image optimization.
4. Vercel deployment setup and environment variables.
5. Production smoke tests.

Acceptance criteria:
- Build passes in CI.
- All public routes return 200 in production.
- Submission flow works end-to-end in deployed environment.

## Priority and Build Order
1. Build shared foundation first.
2. Implement `/1` and `/3` first (narrative + exploration anchors).
3. Implement `/2`, `/4`, `/5` next.
4. Integrate submission and directory after variant shells are stable.
5. Launch with moderation enabled from day one.

## Risks and Mitigations
1. Risk: Five unique designs may diverge too much from shared code.
Mitigation: Separate visuals, but share data contracts and CTA modules.
2. Risk: Animation-heavy pages hurt mobile performance.
Mitigation: Reduced-motion mode and lightweight CSS/JS patterns.
3. Risk: Low-quality submissions reduce trust.
Mitigation: Moderation queue + required structured fields.
4. Risk: Scope creep before launch.
Mitigation: Freeze v1 checklist and defer advanced features.

## Out-of-Scope for v1
1. Full social network features (comments, DMs, likes).
2. Advanced reputation and scoring.
3. Premium analytics and paid promotion tools.
