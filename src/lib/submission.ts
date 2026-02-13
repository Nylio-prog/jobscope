import { shareSubmissionSchema, type ShareSubmission } from './job-schema';

const FLAGGED_TERMS = ['guaranteed income', 'easy money', 'casino', 'crypto pump'];

export type ModerationAssessment = {
  status: 'pending';
  flags: string[];
  containsLink: boolean;
};

export function validateShareSubmission(payload: unknown) {
  return shareSubmissionSchema.safeParse(payload);
}

export function assessSubmissionForModeration(submission: ShareSubmission): ModerationAssessment {
  const aggregateText = [
    submission.roleTitle,
    submission.dayToDay,
    submission.bestParts,
    submission.hardestParts,
    submission.recommendationToStudents,
    submission.educationPath ?? '',
    submission.toolsUsed.join(' '),
  ].join(' ');

  const lowered = aggregateText.toLowerCase();
  const flags = FLAGGED_TERMS.filter((term) => lowered.includes(term));
  const containsLink = /(https?:\/\/|www\.)/i.test(aggregateText);

  return {
    status: 'pending',
    flags,
    containsLink,
  };
}

export function normalizeSubmission(payload: ShareSubmission): ShareSubmission {
  return {
    ...payload,
    contactEmail: payload.contactEmail?.trim() || undefined,
    educationPath: payload.educationPath?.trim() || undefined,
    salaryRange: payload.salaryRange?.trim() || undefined,
  };
}
