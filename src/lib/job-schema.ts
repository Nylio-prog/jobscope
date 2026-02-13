import { z } from 'zod';

export const INDUSTRIES = [
	'Healthcare',
	'Software',
	'Education',
	'Finance',
	'Manufacturing',
	'Media',
	'Government',
	'Retail',
	'Logistics',
	'Energy',
] as const;

export const SENIORITY_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'] as const;
export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export const SUBMITTER_TYPES = ['anonymous', 'public'] as const;
export const PROFILE_STATUS = ['pending', 'approved', 'rejected'] as const;

export const jobProfileSchema = z.object({
	id: z.string().min(3).max(64),
	slug: z
		.string()
		.min(3)
		.max(120)
		.regex(/^[a-z0-9-]+$/),
	locale: z.string().default('en-US'),
	roleTitle: z.string().min(3).max(120),
	industry: z.enum(INDUSTRIES),
	seniority: z.enum(SENIORITY_LEVELS),
	location: z.string().min(2).max(120),
	workMode: z.enum(WORK_MODES),
	salaryRange: z.string().max(80).optional(),
	educationPath: z.string().max(240).optional(),
	dayToDay: z.string().min(30).max(1400),
	toolsUsed: z.array(z.string().min(1).max(64)).max(20),
	bestParts: z.string().min(20).max(900),
	hardestParts: z.string().min(20).max(900),
	recommendationToStudents: z.string().min(20).max(900),
	yearsExperience: z.number().int().min(0).max(50),
	submitterType: z.enum(SUBMITTER_TYPES),
	createdAt: z.string().datetime(),
	approvedAt: z.string().datetime().optional(),
	status: z.enum(PROFILE_STATUS),
});

export const shareSubmissionSchema = jobProfileSchema.pick({
	roleTitle: true,
	industry: true,
	seniority: true,
	location: true,
	workMode: true,
	salaryRange: true,
	educationPath: true,
	dayToDay: true,
	bestParts: true,
	hardestParts: true,
	recommendationToStudents: true,
	yearsExperience: true,
	submitterType: true,
}).extend({
	toolsUsed: z
		.union([z.array(z.string().min(1).max(64)).max(20), z.string().max(300)])
		.transform((value) => {
			if (Array.isArray(value)) {
				return value.map((tool) => tool.trim()).filter(Boolean);
			}

			return value
				.split(',')
				.map((tool) => tool.trim())
				.filter(Boolean)
				.slice(0, 20);
		}),
	contactEmail: z.string().email().max(200).optional().or(z.literal('')),
});

export type JobProfile = z.infer<typeof jobProfileSchema>;
export type ShareSubmissionInput = z.input<typeof shareSubmissionSchema>;
export type ShareSubmission = z.infer<typeof shareSubmissionSchema>;
