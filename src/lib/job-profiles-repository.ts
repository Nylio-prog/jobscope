import { getApprovedJobs, getJobBySlug } from './jobs';
import { jobProfileSchema, type JobProfile, type ShareSubmission } from './job-schema';
import { createUniqueRoleSlug } from './slug';
import type { ModerationAssessment } from './submission';
import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
  isLocalFallbackAllowed,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from './supabase';
import { logError, logWarn } from './telemetry';

const JOB_PROFILES_TABLE = 'job_profiles';
const MODERATION_EVENTS_TABLE = 'moderation_events';
const PENDING_QUEUE_SCAN_LIMIT = 500;
const DUPLICATE_SCAN_LIMIT = 80;

const JOB_PROFILE_COLUMNS = [
  'id',
  'slug',
  'role_title',
  'industry',
  'seniority',
  'location',
  'work_mode',
  'salary_range',
  'education_path',
  'day_to_day',
  'tools_used',
  'best_parts',
  'hardest_parts',
  'recommendation_to_students',
  'years_experience',
  'submitter_type',
  'created_at',
  'approved_at',
  'status',
].join(',');

type JobProfileRow = {
  id: string;
  slug: string;
  role_title: string;
  industry: JobProfile['industry'];
  seniority: JobProfile['seniority'];
  location: string;
  work_mode: JobProfile['workMode'];
  salary_range: string | null;
  education_path: string | null;
  day_to_day: string;
  tools_used: string[] | null;
  best_parts: string;
  hardest_parts: string;
  recommendation_to_students: string;
  years_experience: number;
  submitter_type: JobProfile['submitterType'];
  created_at: string;
  approved_at: string | null;
  status: JobProfile['status'];
};

export function normalizeDbTimestamp(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  let normalized = value.trim();
  if (!normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T');
  }

  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');

  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }

  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  return normalized;
}

function mapDbRowToJobProfile(row: JobProfileRow): JobProfile {
  return jobProfileSchema.parse({
    id: row.id,
    slug: row.slug,
    locale: 'en-US',
    roleTitle: row.role_title,
    industry: row.industry,
    seniority: row.seniority,
    location: row.location,
    workMode: row.work_mode,
    salaryRange: row.salary_range ?? undefined,
    educationPath: row.education_path ?? undefined,
    dayToDay: row.day_to_day,
    toolsUsed: row.tools_used ?? [],
    bestParts: row.best_parts,
    hardestParts: row.hardest_parts,
    recommendationToStudents: row.recommendation_to_students,
    yearsExperience: row.years_experience,
    submitterType: row.submitter_type,
    createdAt: normalizeDbTimestamp(row.created_at) ?? row.created_at,
    approvedAt: normalizeDbTimestamp(row.approved_at),
    status: row.status,
  });
}

function normalizeForComparison(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function jaccardSimilarity(left: string, right: string): number {
  const leftSet = new Set(normalizeForComparison(left));
  const rightSet = new Set(normalizeForComparison(right));

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = new Set([...leftSet, ...rightSet]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function buildSubmissionText(submission: Pick<
  ShareSubmission,
  'dayToDay' | 'bestParts' | 'hardestParts' | 'recommendationToStudents'
>): string {
  return [
    submission.dayToDay,
    submission.bestParts,
    submission.hardestParts,
    submission.recommendationToStudents,
  ].join(' ');
}

type CreateSubmissionResult = {
  id: string;
  slug: string;
  storage: 'supabase' | 'local-fallback';
};

export type DuplicateMatch = {
  slug: string;
  roleTitle: string;
  status: JobProfile['status'];
  similarity: number;
};

type DuplicateCandidateRow = {
  slug: string;
  role_title: string;
  status: JobProfile['status'];
  day_to_day: string;
  best_parts: string;
  hardest_parts: string;
  recommendation_to_students: string;
};

function mapCandidateToDuplicateMatch(
  submission: ShareSubmission,
  candidate: DuplicateCandidateRow,
): DuplicateMatch {
  const submissionText = buildSubmissionText(submission);
  const candidateText = [
    candidate.day_to_day,
    candidate.best_parts,
    candidate.hardest_parts,
    candidate.recommendation_to_students,
  ].join(' ');

  const roleTitleExactMatch =
    candidate.role_title.trim().toLowerCase() === submission.roleTitle.trim().toLowerCase();
  const similarity = jaccardSimilarity(submissionText, candidateText);

  return {
    slug: candidate.slug,
    roleTitle: candidate.role_title,
    status: candidate.status,
    similarity: roleTitleExactMatch ? Math.max(similarity, 0.8) : similarity,
  };
}

export async function findPotentialDuplicateSubmission(
  submission: ShareSubmission,
): Promise<DuplicateMatch | undefined> {
  const localCandidates = getApprovedJobs()
    .filter((job) => job.roleTitle.toLowerCase() === submission.roleTitle.toLowerCase())
    .map(
      (job): DuplicateCandidateRow => ({
        slug: job.slug,
        role_title: job.roleTitle,
        status: job.status,
        day_to_day: job.dayToDay,
        best_parts: job.bestParts,
        hardest_parts: job.hardestParts,
        recommendation_to_students: job.recommendationToStudents,
      }),
    );

  let dbCandidates: DuplicateCandidateRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from(JOB_PROFILES_TABLE)
      .select(
        [
          'slug',
          'role_title',
          'status',
          'day_to_day',
          'best_parts',
          'hardest_parts',
          'recommendation_to_students',
        ].join(','),
      )
      .in('status', ['approved', 'pending'])
      .ilike('role_title', submission.roleTitle)
      .limit(DUPLICATE_SCAN_LIMIT);

    if (error) {
      logWarn('duplicate-detection-query-failed', {
        message: error.message,
      });
    } else if (data) {
      dbCandidates = data as unknown as DuplicateCandidateRow[];
    }
  }

  const bestMatch = [...localCandidates, ...dbCandidates]
    .map((candidate) => mapCandidateToDuplicateMatch(submission, candidate))
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (!bestMatch || bestMatch.similarity < 0.72) {
    return undefined;
  }

  return bestMatch;
}

export async function createPendingSubmission(
  submission: ShareSubmission,
  moderation: ModerationAssessment,
): Promise<CreateSubmissionResult> {
  const slug = createUniqueRoleSlug(submission.roleTitle);

  if (!isSupabaseConfigured()) {
    if (!isLocalFallbackAllowed()) {
      throw new Error(
        'Supabase submission storage is required in production. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
      );
    }

    return {
      id: `local-${Date.now().toString(36)}`,
      slug,
      storage: 'local-fallback',
    };
  }

  const reviewNotes = [
    moderation.containsLink ? 'Contains external link' : '',
    ...moderation.flags.map((flag) => `Flagged phrase: ${flag}`),
  ]
    .filter(Boolean)
    .join(' | ');

  const insertPayload = {
    slug,
    role_title: submission.roleTitle,
    industry: submission.industry,
    seniority: submission.seniority,
    location: submission.location,
    work_mode: submission.workMode,
    salary_range: submission.salaryRange ?? null,
    education_path: submission.educationPath ?? null,
    day_to_day: submission.dayToDay,
    tools_used: submission.toolsUsed,
    best_parts: submission.bestParts,
    hardest_parts: submission.hardestParts,
    recommendation_to_students: submission.recommendationToStudents,
    years_experience: submission.yearsExperience,
    submitter_type: submission.submitterType,
    contact_email: submission.contactEmail ?? null,
    status: 'pending',
    review_notes: reviewNotes || null,
  };

  const insertWithClient = async (
    client: ReturnType<typeof createSupabaseAnonClient>,
  ): Promise<{ id: string; slug: string } | null> => {
    const { data, error } = await client
      .from(JOB_PROFILES_TABLE)
      .insert(insertPayload)
      .select('id,slug')
      .single<{ id: string; slug: string }>();

    if (error || !data) {
      const errorCode = typeof error?.code === 'string' ? error.code : '';
      const errorMessage = (error?.message ?? '').toLowerCase();
      const isRlsViolation = errorCode === '42501' || errorMessage.includes('row-level security');

      if (isRlsViolation && isSupabaseAdminConfigured()) {
        return null;
      }

      throw new Error(error?.message ?? 'Failed to insert pending submission into Supabase.');
    }

    return data;
  };

  const anonClient = createSupabaseAnonClient();
  let inserted = await insertWithClient(anonClient);

  if (!inserted && isSupabaseAdminConfigured()) {
    const adminClient = createSupabaseAdminClient();
    inserted = await insertWithClient(adminClient);
  }

  if (!inserted) {
    throw new Error(
      'Supabase blocked the submission due to row-level security. Configure insert policy or set SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return {
    id: inserted.id,
    slug: inserted.slug,
    storage: 'supabase',
  };
}

export async function listApprovedJobProfiles(): Promise<JobProfile[]> {
  if (!isSupabaseConfigured()) {
    return getApprovedJobs();
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from(JOB_PROFILES_TABLE)
    .select(JOB_PROFILE_COLUMNS)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Supabase approved jobs query failed:', error?.message ?? 'unknown error');
    return getApprovedJobs();
  }

  const rows = data as unknown as JobProfileRow[];
  return rows.map(mapDbRowToJobProfile);
}

export async function getApprovedJobProfileBySlug(slug: string): Promise<JobProfile | undefined> {
  if (!isSupabaseConfigured()) {
    return getJobBySlug(slug);
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from(JOB_PROFILES_TABLE)
    .select(JOB_PROFILE_COLUMNS)
    .eq('status', 'approved')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Supabase job-by-slug query failed:', error.message);
    return getJobBySlug(slug);
  }

  if (!data) {
    return undefined;
  }

  const row = data as unknown as JobProfileRow;
  return mapDbRowToJobProfile(row);
}

type ModerationStatus = 'approved' | 'rejected';

export type PendingSubmissionPreview = {
  id: string;
  slug: string;
  roleTitle: string;
  industry: string;
  seniority: string;
  location: string;
  workMode: string;
  salaryRange: string | null;
  educationPath: string | null;
  dayToDay: string;
  toolsUsed: string[];
  bestParts: string;
  hardestParts: string;
  recommendationToStudents: string;
  yearsExperience: number;
  submitterType: string;
  contactEmail: string | null;
  createdAt: string;
  reviewNotes: string | null;
  hasFlags: boolean;
};

type PendingSubmissionRow = {
  id: string;
  slug: string;
  role_title: string;
  industry: string;
  seniority: string;
  location: string;
  work_mode: string;
  salary_range: string | null;
  education_path: string | null;
  day_to_day: string;
  tools_used: string[] | null;
  best_parts: string;
  hardest_parts: string;
  recommendation_to_students: string;
  years_experience: number;
  submitter_type: string;
  contact_email: string | null;
  created_at: string;
  review_notes: string | null;
};

export type PendingListSort = 'newest' | 'oldest' | 'flagged';

export type PendingListOptions = {
  sort?: PendingListSort;
  industry?: string;
  submitterType?: string;
  limit?: number;
  offset?: number;
};

export type PendingSubmissionMetrics = {
  total: number;
  flagged: number;
  olderThan24h: number;
  olderThan72h: number;
};

export type PendingSubmissionsResult = {
  items: PendingSubmissionPreview[];
  total: number;
  metrics: PendingSubmissionMetrics;
};

function hasRiskFlag(reviewNotes: string | null): boolean {
  if (!reviewNotes) {
    return false;
  }

  return /(flagged phrase|contains external link|possible duplicate)/i.test(reviewNotes);
}

function mapPendingRow(row: PendingSubmissionRow): PendingSubmissionPreview {
  return {
    id: row.id as string,
    slug: row.slug as string,
    roleTitle: row.role_title as string,
    industry: row.industry as string,
    seniority: row.seniority as string,
    location: row.location as string,
    workMode: row.work_mode as string,
    salaryRange: (row.salary_range as string | null) ?? null,
    educationPath: (row.education_path as string | null) ?? null,
    dayToDay: row.day_to_day as string,
    toolsUsed: (row.tools_used as string[] | null) ?? [],
    bestParts: row.best_parts as string,
    hardestParts: row.hardest_parts as string,
    recommendationToStudents: row.recommendation_to_students as string,
    yearsExperience: row.years_experience as number,
    submitterType: row.submitter_type as string,
    contactEmail: (row.contact_email as string | null) ?? null,
    createdAt: normalizeDbTimestamp(row.created_at as string) ?? (row.created_at as string),
    reviewNotes: (row.review_notes as string | null) ?? null,
    hasFlags: hasRiskFlag((row.review_notes as string | null) ?? null),
  };
}

function sortPending(
  items: PendingSubmissionPreview[],
  sort: PendingListSort,
): PendingSubmissionPreview[] {
  const copy = [...items];

  switch (sort) {
    case 'oldest':
      return copy.sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    case 'flagged':
      return copy.sort((left, right) => {
        if (left.hasFlags !== right.hasFlags) {
          return Number(right.hasFlags) - Number(left.hasFlags);
        }

        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      });
    case 'newest':
    default:
      return copy.sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  }
}

export async function listPendingSubmissions(
  options: PendingListOptions = {},
): Promise<PendingSubmissionsResult> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin key is missing. Set SUPABASE_SERVICE_ROLE_KEY to list pending submissions.',
    );
  }

  const sort = options.sort ?? 'newest';
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(JOB_PROFILES_TABLE)
    .select(
      [
        'id',
        'slug',
        'role_title',
        'industry',
        'seniority',
        'location',
        'work_mode',
        'salary_range',
        'education_path',
        'day_to_day',
        'tools_used',
        'best_parts',
        'hardest_parts',
        'recommendation_to_students',
        'years_experience',
        'submitter_type',
        'contact_email',
        'created_at',
        'review_notes',
      ].join(','),
    )
    .eq('status', 'pending')
    .limit(PENDING_QUEUE_SCAN_LIMIT);

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to fetch pending submissions.');
  }

  const now = Date.now();
  const allItems = (data as unknown as PendingSubmissionRow[]).map(mapPendingRow);
  const filtered = allItems.filter((item) => {
    const industryMatch = options.industry ? item.industry === options.industry : true;
    const submitterMatch = options.submitterType ? item.submitterType === options.submitterType : true;
    return industryMatch && submitterMatch;
  });
  const sorted = sortPending(filtered, sort);
  const items = sorted.slice(offset, offset + limit);

  const metrics = filtered.reduce<PendingSubmissionMetrics>(
    (acc, item) => {
      const ageMs = now - new Date(item.createdAt).getTime();
      acc.total += 1;
      if (item.hasFlags) {
        acc.flagged += 1;
      }
      if (ageMs >= 24 * 60 * 60 * 1000) {
        acc.olderThan24h += 1;
      }
      if (ageMs >= 72 * 60 * 60 * 1000) {
        acc.olderThan72h += 1;
      }
      return acc;
    },
    {
      total: 0,
      flagged: 0,
      olderThan24h: 0,
      olderThan72h: 0,
    },
  );

  return {
    items,
    total: filtered.length,
    metrics,
  };
}

export async function updateSubmissionModeration(
  id: string,
  status: ModerationStatus,
  moderatorUserId: string,
  reviewNotes?: string,
): Promise<{ id: string; status: ModerationStatus; auditLogged: boolean }> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin key is missing. Set SUPABASE_SERVICE_ROLE_KEY to moderate submissions.',
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: readError } = await supabase
    .from(JOB_PROFILES_TABLE)
    .select('status')
    .eq('id', id)
    .single<{ status: JobProfile['status'] }>();

  if (readError || !existing) {
    throw new Error(readError?.message ?? 'Failed to load submission before moderation update.');
  }

  const isApproved = status === 'approved';
  const updatePayload = {
    status,
    review_notes: reviewNotes?.trim() || null,
    approved_at: isApproved ? new Date().toISOString() : null,
    approved_by: isApproved ? moderatorUserId : null,
  };

  const { data, error } = await supabase
    .from(JOB_PROFILES_TABLE)
    .update(updatePayload)
    .eq('id', id)
    .select('id,status')
    .single<{ id: string; status: ModerationStatus }>();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to update submission moderation status.');
  }

  let auditLogged = false;
  const { error: auditError } = await supabase.from(MODERATION_EVENTS_TABLE).insert({
    job_profile_id: id,
    actor_user_id: moderatorUserId,
    action: isApproved ? 'approve' : 'reject',
    old_status: existing.status,
    new_status: status,
    note: reviewNotes?.trim() || null,
    created_at: new Date().toISOString(),
  });

  if (auditError) {
    const knownMissingTable =
      auditError.code === '42P01' || auditError.message.toLowerCase().includes('does not exist');
    if (knownMissingTable) {
      logWarn('moderation-audit-table-missing', {
        message: auditError.message,
      });
    } else {
      logError('moderation-audit-write-failed', {
        message: auditError.message,
      });
    }
  } else {
    auditLogged = true;
  }

  return {
    ...data,
    auditLogged,
  };
}
