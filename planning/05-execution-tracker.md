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
- `DONE` Scaffold Astro + TypeScript project.
- `DONE` Add Vercel adapter and core scripts.
- `DONE` Add linting, formatting, and strict TS config.

## Phase 2 - Data Layer and Validation
- `DONE` Implement shared job schema with Zod.
- `DONE` Add seed dataset for development/demo.
- `DONE` Implement filtering and sorting utilities.

## Phase 3 - Shared UI System
- `DONE` Create base layout and route shells.
- `DONE` Create global design tokens and typography system.
- `DONE` Implement shared CTA, cards, chips, and footer modules.

## Phase 4 - Homepage Variants
- `DONE` Build `/1` Career City.
- `DONE` Build `/2` Orbit of Work.
- `DONE` Build `/3` A Day In The Job.
- `DONE` Build `/4` Wall of Paths.
- `DONE` Build `/5` Mission Control.

## Phase 5 - Core Product Flows
- `DONE` Build `/jobs` directory with filters.
- `DONE` Build `/jobs/[slug]` detail page.
- `DONE` Build `/share` form with validation and submission endpoint.
- `DONE` Add moderation status handling and clear user messaging.

## Phase 6 - Automated Tests and QA
- `DONE` Unit tests for schemas and core utilities.
- `DONE` Route-level smoke tests for main pages.
- `DONE` Submission flow API tests (success and validation failure).
- `DONE` Seed data quality tests.
- `DONE` Run full test campaign and capture results.

## Phase 7 - Build and Delivery
- `DONE` Production build verification (passes on Linux filesystem; `/mnt/c/...` mount triggers local EPERM during Vercel copy step).
- `DONE` Final docs: setup, env vars, deploy, moderation workflow.
- `DONE` Final pass for accessibility and reduced-motion handling.
- `DONE` Prepare handoff summary and next steps.

## Mandatory Test Campaign Definition
1. `npm run test`: all unit/integration tests must pass.
2. `npm run test:coverage`: enforce coverage report generation.
3. `npm run build`: production build must succeed.
4. Manual smoke checks:
- `/`, `/1`, `/2`, `/3`, `/4`, `/5`
- `/jobs`, `/jobs/[slug]`, `/share`
- API submission validation behavior
