# JobScope v1

JobScope is a career-discovery website where students and early-career users can explore structured, real-world job stories.

## Implemented v1 routes

- `/` gateway page linking all five homepage concepts
- `/1` Career City
- `/2` Orbit of Work
- `/3` A Day In The Job
- `/4` Wall of Paths
- `/5` Mission Control
- `/jobs` filterable directory
- `/jobs/[slug]` role detail page
- `/share` structured contribution form
- `/api/share` submission validation endpoint
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

## Notes

- Submissions are accepted without login and always marked `pending` for manual moderation.
- Seed data includes 20 approved job profiles for demo and testing.
- If building from a Windows-mounted path (for example `/mnt/c/...` in WSL), Vercel adapter copy steps may hit `EPERM`; build from a native Linux path (for example `/tmp/...`) to validate packaging.
