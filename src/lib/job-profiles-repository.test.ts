import { describe, expect, it } from 'vitest';

import { normalizeDbTimestamp } from './job-profiles-repository';

describe('normalizeDbTimestamp', () => {
  it('converts postgres timestamp with +00 offset into RFC3339 format', () => {
    const normalized = normalizeDbTimestamp('2026-02-13 07:40:11.123456+00');
    expect(normalized).toBe('2026-02-13T07:40:11.123456+00:00');
  });

  it('keeps already valid offset datetime values', () => {
    const normalized = normalizeDbTimestamp('2026-02-13T07:40:11.123Z');
    expect(normalized).toBe('2026-02-13T07:40:11.123Z');
  });
});
