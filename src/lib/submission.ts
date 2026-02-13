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
  const normalizeText = (value: string | undefined) =>
    value
      ?.trim()
      .replace(/\s+/g, ' ');

  return {
    ...payload,
    roleTitle: normalizeText(payload.roleTitle) ?? payload.roleTitle,
    location: normalizeText(payload.location) ?? payload.location,
    dayToDay: normalizeText(payload.dayToDay) ?? payload.dayToDay,
    bestParts: normalizeText(payload.bestParts) ?? payload.bestParts,
    hardestParts: normalizeText(payload.hardestParts) ?? payload.hardestParts,
    recommendationToStudents:
      normalizeText(payload.recommendationToStudents) ?? payload.recommendationToStudents,
    contactEmail: payload.contactEmail?.trim().toLowerCase() || undefined,
    educationPath: normalizeText(payload.educationPath) || undefined,
    salaryRange: normalizeText(payload.salaryRange) || undefined,
    toolsUsed: [...new Set(payload.toolsUsed.map((tool) => normalizeText(tool) ?? tool))].filter(
      Boolean,
    ),
  };
}
