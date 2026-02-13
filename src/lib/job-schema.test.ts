import { describe, expect, it } from 'vitest';

import { jobProfileSchema } from './job-schema';

describe('jobProfileSchema', () => {
	it('accepts valid job profile payload', () => {
		const parsed = jobProfileSchema.parse({
			id: 'job-test-01',
			slug: 'test-role-profile',
			locale: 'en-US',
			roleTitle: 'Test Role',
			industry: 'Software',
			seniority: 'Entry',
			location: 'Remote',
			workMode: 'remote',
			salaryRange: '$50k-$60k',
			educationPath: 'Self-taught and bootcamp',
			dayToDay:
				'Builds features, runs tests, collaborates with peers, and documents tradeoffs for each release cycle.',
			toolsUsed: ['TypeScript', 'Vitest'],
			bestParts:
				'Hands-on iteration and clear user impact make the role feel meaningful and practical.',
			hardestParts:
				'Prioritization under changing deadlines can be difficult without clear communication practices.',
			recommendationToStudents:
				'Build real projects and explain your choices; communication and implementation quality both matter.',
			yearsExperience: 2,
			submitterType: 'public',
			createdAt: '2025-01-01T00:00:00.000Z',
			approvedAt: '2025-01-02T00:00:00.000Z',
			status: 'approved',
		});

		expect(parsed.slug).toBe('test-role-profile');
		expect(parsed.workMode).toBe('remote');
	});

	it('rejects invalid work mode and short narrative fields', () => {
		const result = jobProfileSchema.safeParse({
			id: 'job-test-02',
			slug: 'broken-role',
			locale: 'en-US',
			roleTitle: 'Broken Role',
			industry: 'Software',
			seniority: 'Entry',
			location: 'Remote',
			workMode: 'office',
			dayToDay: 'Too short',
			toolsUsed: ['TypeScript'],
			bestParts: 'Too short',
			hardestParts: 'Too short',
			recommendationToStudents: 'Too short',
			yearsExperience: 1,
			submitterType: 'public',
			createdAt: '2025-01-01T00:00:00.000Z',
			status: 'approved',
		});

		expect(result.success).toBe(false);
	});
});
