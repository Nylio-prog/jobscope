import { jobProfiles } from '../data/job-profiles';
import type { JobProfile } from './job-schema';

export const SORT_OPTIONS = [
	'newest',
	'experience-asc',
	'experience-desc',
	'title-asc',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export type JobDirectoryFilters = {
	query?: string;
	industry?: string;
	workMode?: string;
	sort?: SortOption;
};

export function getApprovedJobs(): JobProfile[] {
	return jobProfiles.filter((job) => job.status === 'approved');
}

export function getJobBySlug(slug: string): JobProfile | undefined {
	return getApprovedJobs().find((job) => job.slug === slug);
}

export function getDirectoryFacets(jobs: JobProfile[] = getApprovedJobs()): {
	industries: string[];
	workModes: string[];
} {
	return {
		industries: [...new Set(jobs.map((job) => job.industry))].sort((a, b) => a.localeCompare(b)),
		workModes: [...new Set(jobs.map((job) => job.workMode))],
	};
}

export function applyJobFilters(
	jobs: JobProfile[],
	{ query, industry, workMode }: JobDirectoryFilters,
): JobProfile[] {
	const normalizedQuery = query?.trim().toLowerCase();

	return jobs.filter((job) => {
		const matchesIndustry = industry ? job.industry === industry : true;
		const matchesWorkMode = workMode ? job.workMode === workMode : true;
		const matchesQuery = normalizedQuery
			? [
					job.roleTitle,
					job.industry,
					job.location,
					job.dayToDay,
					job.recommendationToStudents,
				]
					.join(' ')
					.toLowerCase()
					.includes(normalizedQuery)
			: true;

		return matchesIndustry && matchesWorkMode && matchesQuery;
	});
}

export function sortJobs(jobs: JobProfile[], sort: SortOption = 'newest'): JobProfile[] {
	const copy = [...jobs];

	switch (sort) {
		case 'experience-asc':
			return copy.sort((a, b) => a.yearsExperience - b.yearsExperience);
		case 'experience-desc':
			return copy.sort((a, b) => b.yearsExperience - a.yearsExperience);
		case 'title-asc':
			return copy.sort((a, b) => a.roleTitle.localeCompare(b.roleTitle));
		case 'newest':
		default:
			return copy.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
	}
}

export function parseDirectoryFilters(searchParams: URLSearchParams): JobDirectoryFilters {
	const sortValue = searchParams.get('sort');
	const sort = SORT_OPTIONS.includes(sortValue as SortOption)
		? (sortValue as SortOption)
		: 'newest';

	return {
		query: searchParams.get('q') ?? undefined,
		industry: searchParams.get('industry') ?? undefined,
		workMode: searchParams.get('workMode') ?? undefined,
		sort,
	};
}
