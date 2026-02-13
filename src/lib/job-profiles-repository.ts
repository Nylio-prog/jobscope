import { getApprovedJobs, getJobBySlug } from './jobs';
import { jobProfileSchema, type JobProfile, type ShareSubmission } from './job-schema';
import { createUniqueRoleSlug } from './slug';
import type { ModerationAssessment } from './submission';
import {
  createSupabaseAdminClient,
  createSupabaseAnonClient,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from './supabase';

const JOB_PROFILES_TABLE = 'job_profiles';

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
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? undefined,
    status: row.status,
  });
}

type CreateSubmissionResult = {
  id: string;
  slug: string;
  storage: 'supabase' | 'local-fallback';
};

export async function createPendingSubmission(
  submission: ShareSubmission,
  moderation: ModerationAssessment,
): Promise<CreateSubmissionResult> {
  const slug = createUniqueRoleSlug(submission.roleTitle);

  if (!isSupabaseConfigured()) {
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
  location: string;
  workMode: string;
  yearsExperience: number;
  createdAt: string;
  reviewNotes: string | null;
};

export async function listPendingSubmissions(): Promise<PendingSubmissionPreview[]> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin key is missing. Set SUPABASE_SERVICE_ROLE_KEY to list pending submissions.',
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(JOB_PROFILES_TABLE)
    .select(
      'id,slug,role_title,industry,location,work_mode,years_experience,created_at,review_notes',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to fetch pending submissions.');
  }

  return data.map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    roleTitle: row.role_title as string,
    industry: row.industry as string,
    location: row.location as string,
    workMode: row.work_mode as string,
    yearsExperience: row.years_experience as number,
    createdAt: row.created_at as string,
    reviewNotes: (row.review_notes as string | null) ?? null,
  }));
}

export async function updateSubmissionModeration(
  id: string,
  status: ModerationStatus,
  moderatorUserId: string,
  reviewNotes?: string,
): Promise<{ id: string; status: ModerationStatus }> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin key is missing. Set SUPABASE_SERVICE_ROLE_KEY to moderate submissions.',
    );
  }

  const supabase = createSupabaseAdminClient();
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

  return data;
}
