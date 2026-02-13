# V1 Execution Tracker

Last updated: 2026-02-13

## Status Key
- `TODO`
- `IN_PROGRESS`
- `DONE`

## Phase 0 - Planning Baseline
- `DONE` Finalize project plan and task breakdown.
- `DONE` Finalize recommended defaults for v1 scope.
- `DONE` Create execution tracker for active work.

## Phase 1 - Project Scaffold and Tooling
- `TODO` Scaffold Astro + TypeScript project.
- `TODO` Add Vercel adapter and core scripts.
- `TODO` Add linting, formatting, and strict TS config.

## Phase 2 - Data Layer and Validation
- `TODO` Implement shared job schema with Zod.
- `TODO` Add seed dataset for development/demo.
- `TODO` Implement filtering and sorting utilities.

## Phase 3 - Shared UI System
- `TODO` Create base layout and route shells.
- `TODO` Create global design tokens and typography system.
- `TODO` Implement shared CTA, cards, chips, and footer modules.

## Phase 4 - Homepage Variants
- `TODO` Build `/1` Career City.
- `TODO` Build `/2` Orbit of Work.
- `TODO` Build `/3` A Day In The Job.
- `TODO` Build `/4` Wall of Paths.
- `TODO` Build `/5` Mission Control.

## Phase 5 - Core Product Flows
- `TODO` Build `/jobs` directory with filters.
- `TODO` Build `/jobs/[slug]` detail page.
- `TODO` Build `/share` form with validation and submission endpoint.
- `TODO` Add moderation status handling and clear user messaging.

## Phase 6 - Automated Tests and QA
- `TODO` Unit tests for schemas and core utilities.
- `TODO` Route-level smoke tests for main pages.
- `TODO` Submission flow API tests (success and validation failure).
- `TODO` Seed data quality tests.
- `TODO` Run full test campaign and capture results.

## Phase 7 - Build and Delivery
- `TODO` Production build verification.
- `TODO` Final docs: setup, env vars, deploy, moderation workflow.
- `TODO` Final pass for accessibility and reduced-motion handling.
- `TODO` Prepare handoff summary and next steps.

## Mandatory Test Campaign Definition
1. `npm run test`: all unit/integration tests must pass.
2. `npm run test:coverage`: enforce coverage report generation.
3. `npm run build`: production build must succeed.
4. Manual smoke checks:
- `/`, `/1`, `/2`, `/3`, `/4`, `/5`
- `/jobs`, `/jobs/[slug]`, `/share`
- API submission validation behavior
