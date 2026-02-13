import { jobProfiles } from '../data/job-profiles';
import type { JobProfile } from './job-schema';

export const SORT_OPTIONS = ['newest', 'experience-asc', 'experience-desc', 'title-asc'] as const;
export const EXPERIENCE_BANDS = ['0-2', '3-5', '6-10', '11+'] as const;
export const PAGE_SIZE = 12;

export type SortOption = (typeof SORT_OPTIONS)[number];
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export type JobDirectoryFilters = {
  query?: string;
  industry?: string;
  workMode?: string;
  seniority?: string;
  region?: string;
  experienceBand?: ExperienceBand;
  salaryProvided?: boolean;
  sort?: SortOption;
  compare?: string[];
  page?: number;
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
  seniorities: string[];
} {
  return {
    industries: [...new Set(jobs.map((job) => job.industry))].sort((a, b) => a.localeCompare(b)),
    workModes: [...new Set(jobs.map((job) => job.workMode))],
    seniorities: [...new Set(jobs.map((job) => job.seniority))],
  };
}

function matchesExperienceBand(yearsExperience: number, experienceBand?: ExperienceBand): boolean {
  switch (experienceBand) {
    case '0-2':
      return yearsExperience >= 0 && yearsExperience <= 2;
    case '3-5':
      return yearsExperience >= 3 && yearsExperience <= 5;
    case '6-10':
      return yearsExperience >= 6 && yearsExperience <= 10;
    case '11+':
      return yearsExperience >= 11;
    default:
      return true;
  }
}

export function applyJobFilters(
  jobs: JobProfile[],
  { query, industry, workMode, seniority, region, experienceBand, salaryProvided }: JobDirectoryFilters,
): JobProfile[] {
  const normalizedQuery = query?.trim().toLowerCase();
  const normalizedRegion = region?.trim().toLowerCase();

  return jobs.filter((job) => {
    const matchesIndustry = industry ? job.industry === industry : true;
    const matchesWorkMode = workMode ? job.workMode === workMode : true;
    const matchesSeniority = seniority ? job.seniority === seniority : true;
    const matchesRegion = normalizedRegion ? job.location.toLowerCase().includes(normalizedRegion) : true;
    const matchesExperience = matchesExperienceBand(job.yearsExperience, experienceBand);
    const matchesSalary = salaryProvided ? Boolean(job.salaryRange?.trim()) : true;
    const matchesQuery = normalizedQuery
      ? [job.roleTitle, job.industry, job.location, job.dayToDay, job.recommendationToStudents]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      : true;

    return (
      matchesIndustry &&
      matchesWorkMode &&
      matchesSeniority &&
      matchesRegion &&
      matchesExperience &&
      matchesSalary &&
      matchesQuery
    );
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
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export function parseDirectoryFilters(searchParams: URLSearchParams): JobDirectoryFilters {
  const sortValue = searchParams.get('sort');
  const sort = SORT_OPTIONS.includes(sortValue as SortOption)
    ? (sortValue as SortOption)
    : 'newest';
  const experienceBandValue = searchParams.get('experienceBand');
  const experienceBand = EXPERIENCE_BANDS.includes(experienceBandValue as ExperienceBand)
    ? (experienceBandValue as ExperienceBand)
    : undefined;
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const compare = [...new Set(searchParams.getAll('compare').filter(Boolean))].slice(0, 3);

  return {
    query: searchParams.get('q') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    workMode: searchParams.get('workMode') ?? undefined,
    seniority: searchParams.get('seniority') ?? undefined,
    region: searchParams.get('region') ?? undefined,
    experienceBand,
    salaryProvided: searchParams.get('salaryProvided') === '1',
    sort,
    compare,
    page,
  };
}
