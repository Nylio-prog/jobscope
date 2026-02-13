import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const REQUIRED_ROUTE_FILES = [
  'src/pages/index.astro',
  'src/pages/1.astro',
  'src/pages/2.astro',
  'src/pages/3.astro',
  'src/pages/4.astro',
  'src/pages/5.astro',
  'src/pages/jobs/index.astro',
  'src/pages/jobs/[slug].astro',
  'src/pages/share.astro',
  'src/pages/about.astro',
  'src/pages/guidelines.astro',
];

describe('route-level smoke checks', () => {
  it('keeps all required v1 route files in place', () => {
    for (const routeFile of REQUIRED_ROUTE_FILES) {
      expect(existsSync(resolve(routeFile))).toBe(true);
    }
  });
});
