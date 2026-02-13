import { describe, expect, it } from 'vitest';

import { jobProfiles } from '../data/job-profiles';

describe('seed data quality', () => {
  it('contains at least 20 validated profiles', () => {
    expect(jobProfiles.length).toBeGreaterThanOrEqual(20);
  });

  it('covers at least three industries and three seniority levels', () => {
    const industries = new Set(jobProfiles.map((job) => job.industry));
    const seniorities = new Set(jobProfiles.map((job) => job.seniority));

    expect(industries.size).toBeGreaterThanOrEqual(3);
    expect(seniorities.size).toBeGreaterThanOrEqual(3);
  });

  it('keeps public seed profiles approved for directory display', () => {
    expect(jobProfiles.every((job) => job.status === 'approved')).toBe(true);
  });
});
