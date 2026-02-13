import { beforeEach, describe, expect, it } from 'vitest';

import { clearRateLimitBucket } from '../../lib/rate-limit';
import { POST } from './share';

const validPayload = {
  roleTitle: 'Support Engineer',
  industry: 'Software',
  seniority: 'Entry',
  location: 'Remote',
  workMode: 'remote',
  salaryRange: '$70k-$85k',
  educationPath: 'CS degree and apprenticeship',
  dayToDay:
    'I troubleshoot customer issues, reproduce bugs, and collaborate with product teams on prioritized fixes.',
  toolsUsed: 'SQL, Ticketing systems, TypeScript',
  bestParts:
    'Helping users succeed and seeing product improvements from recurring issue patterns is rewarding.',
  hardestParts:
    'Balancing urgent incident work with long-term preventive improvements can be difficult under pressure.',
  recommendationToStudents:
    'Learn debugging fundamentals and written communication because both are central to support roles.',
  yearsExperience: 2,
  submitterType: 'public',
  contactEmail: 'support@example.com',
};

describe('POST /api/share', () => {
  beforeEach(() => {
    clearRateLimitBucket();
  });

  it('accepts valid submission payloads', async () => {
    const response = await POST({
      request: new Request('http://localhost/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validPayload),
      }),
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('pending');
    expect(body.submissionId).toBeDefined();
    expect(['local-fallback', 'supabase']).toContain(body.storage);
  });

  it('rejects invalid submissions with field errors', async () => {
    const response = await POST({
      request: new Request('http://localhost/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roleTitle: '' }),
      }),
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.errors).toBeDefined();
  });

  it('drops honeypot submissions without persisting', async () => {
    const response = await POST({
      request: new Request('http://localhost/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...validPayload,
          website: 'https://spam.example',
        }),
      }),
    } as any);

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.submissionId).toBeUndefined();
  });
});
