import { describe, expect, it } from 'vitest';

import { getApprovedJobs } from './jobs';
import { applyJobFilters, parseDirectoryFilters, sortJobs } from './jobs';

describe('jobs utilities', () => {
  it('filters by industry and work mode', () => {
    const jobs = getApprovedJobs();
    const filtered = applyJobFilters(jobs, {
      industry: 'Software',
      workMode: 'hybrid',
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((job) => job.industry === 'Software')).toBe(true);
    expect(filtered.every((job) => job.workMode === 'hybrid')).toBe(true);
  });

  it('supports text query matching', () => {
    const jobs = getApprovedJobs();
    const filtered = applyJobFilters(jobs, { query: 'nurse' });
    expect(filtered.some((job) => job.roleTitle.includes('Nurse'))).toBe(true);
  });

  it('sorts by newest as default and by experience descending', () => {
    const jobs = getApprovedJobs();
    const newest = sortJobs(jobs);
    const experience = sortJobs(jobs, 'experience-desc');

    expect(new Date(newest[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(newest[1].createdAt).getTime(),
    );
    expect(experience[0].yearsExperience).toBeGreaterThanOrEqual(experience[1].yearsExperience);
  });

  it('parses supported directory filters from URL search params', () => {
    const parsed = parseDirectoryFilters(
      new URLSearchParams({
        q: 'policy',
        industry: 'Government',
        workMode: 'hybrid',
        seniority: 'Mid',
        experienceBand: '3-5',
        salaryProvided: '1',
        region: 'us',
        compare: 'policy-analyst-public-sector',
        sort: 'title-asc',
        page: '2',
      }),
    );

    expect(parsed.query).toBe('policy');
    expect(parsed.industry).toBe('Government');
    expect(parsed.workMode).toBe('hybrid');
    expect(parsed.seniority).toBe('Mid');
    expect(parsed.experienceBand).toBe('3-5');
    expect(parsed.salaryProvided).toBe(true);
    expect(parsed.region).toBe('us');
    expect(parsed.compare).toEqual(['policy-analyst-public-sector']);
    expect(parsed.page).toBe(2);
    expect(parsed.sort).toBe('title-asc');
  });

  it('filters by salary presence, seniority, and experience band', () => {
    const jobs = getApprovedJobs();
    const filtered = applyJobFilters(jobs, {
      seniority: 'Senior',
      experienceBand: '6-10',
      salaryProvided: true,
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((job) => job.seniority === 'Senior')).toBe(true);
    expect(filtered.every((job) => job.yearsExperience >= 6 && job.yearsExperience <= 10)).toBe(
      true,
    );
    expect(filtered.every((job) => Boolean(job.salaryRange))).toBe(true);
  });
});
