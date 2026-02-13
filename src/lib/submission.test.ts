import { describe, expect, it } from 'vitest';

import {
  assessSubmissionForModeration,
  normalizeSubmission,
  validateShareSubmission,
} from './submission';

const basePayload = {
  roleTitle: 'Frontend Engineer',
  industry: 'Software',
  seniority: 'Entry',
  location: 'Remote',
  workMode: 'remote',
  salaryRange: '$80k-$95k',
  educationPath: 'Bootcamp and mentorship',
  dayToDay:
    'I build product features, test edge cases, and collaborate with design and product daily.',
  toolsUsed: 'TypeScript, Astro, Vitest',
  bestParts: 'Rapid feedback from users helps me improve both code quality and product judgment.',
  hardestParts:
    'Sometimes timeline pressure makes it difficult to balance clean architecture with delivery speed.',
  recommendationToStudents:
    'Build complete projects, write short postmortems, and get used to presenting tradeoffs clearly.',
  yearsExperience: 2,
  submitterType: 'public',
  contactEmail: 'person@example.com',
} as const;

describe('submission utilities', () => {
  it('validates and transforms tools into an array', () => {
    const parsed = validateShareSubmission(basePayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.toolsUsed).toEqual(['TypeScript', 'Astro', 'Vitest']);
    }
  });

  it('flags suspicious phrasing in content', () => {
    const parsed = validateShareSubmission({
      ...basePayload,
      dayToDay:
        'I post guaranteed income tips and easy money scripts, then run outreach campaigns all day.',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const moderation = assessSubmissionForModeration(parsed.data);
      expect(moderation.flags.length).toBeGreaterThan(0);
    }
  });

  it('normalizes optional string fields', () => {
    const parsed = validateShareSubmission({
      ...basePayload,
      educationPath: ' ',
      contactEmail: '',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const normalized = normalizeSubmission(parsed.data);
      expect(normalized.educationPath).toBeUndefined();
      expect(normalized.contactEmail).toBeUndefined();
    }
  });
});
