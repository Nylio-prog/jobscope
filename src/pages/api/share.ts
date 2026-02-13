import type { APIRoute } from 'astro';

import { findPotentialDuplicateSubmission, createPendingSubmission } from '../../lib/job-profiles-repository';
import { buildClientFingerprint } from '../../lib/request-metadata';
import { checkRateLimit } from '../../lib/rate-limit';
import { logError, logInfo } from '../../lib/telemetry';
import {
  assessSubmissionForModeration,
  normalizeSubmission,
  validateShareSubmission,
} from '../../lib/submission';

export const prerender = false;

const DEFAULT_RATE_LIMIT = 8;
const DEFAULT_RATE_WINDOW_MS = 10 * 60 * 1000;

const RATE_LIMIT_MAX = Number(import.meta.env.SHARE_RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT);
const RATE_LIMIT_WINDOW_MS = Number(
  import.meta.env.SHARE_RATE_LIMIT_WINDOW_MS ?? DEFAULT_RATE_WINDOW_MS,
);

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

async function extractSubmissionPayload(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const payload = await extractSubmissionPayload(request);
  if (!payload) {
    return json(
      {
        ok: false,
        message: 'Unsupported content type. Use JSON or form data.',
      },
      415,
    );
  }

  const fingerprint = buildClientFingerprint(request);
  const limit = checkRateLimit({
    key: `share:${fingerprint}`,
    limit: Number.isFinite(RATE_LIMIT_MAX) ? RATE_LIMIT_MAX : DEFAULT_RATE_LIMIT,
    windowMs: Number.isFinite(RATE_LIMIT_WINDOW_MS) ? RATE_LIMIT_WINDOW_MS : DEFAULT_RATE_WINDOW_MS,
  });

  if (!limit.allowed) {
    return json(
      {
        ok: false,
        message: 'Too many submissions in a short period. Please wait and try again.',
      },
      429,
      {
        'Retry-After': String(limit.retryAfterSeconds),
      },
    );
  }

  if (typeof payload.website === 'string' && payload.website.trim().length > 0) {
    logInfo('share-honeypot-triggered', {
      fingerprint,
    });

    return json(
      {
        ok: true,
        message: 'Submission received. It is now pending manual moderation.',
        status: 'pending',
      },
      202,
    );
  }

  const parsed = validateShareSubmission(payload);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        message: 'Please fix the highlighted fields and submit again.',
        errors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const normalized = normalizeSubmission(parsed.data);
  const moderation = assessSubmissionForModeration(normalized);

  const duplicate = await findPotentialDuplicateSubmission(normalized);
  if (duplicate && duplicate.similarity >= 0.78) {
    return json(
      {
        ok: false,
        message:
          'This looks very similar to an existing story. Please submit a meaningfully different experience.',
        duplicate,
      },
      409,
    );
  }
  if (duplicate) {
    moderation.flags.push(`Possible duplicate of ${duplicate.slug} (${Math.round(duplicate.similarity * 100)}%)`);
  }

  try {
    const persisted = await createPendingSubmission(normalized, moderation);

    return json({
      ok: true,
      message: 'Submission received. It is now pending manual moderation.',
      status: moderation.status,
      submissionId: persisted.id,
      slug: persisted.slug,
      storage: persisted.storage,
      moderation,
      rateLimit: {
        remaining: limit.remaining,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submission could not be persisted.';
    const normalizedMessage = message.toLowerCase();
    const isRls = normalizedMessage.includes('row-level security');
    logError('share-submit-failed', {
      message,
      fingerprint,
    });

    return json(
      {
        ok: false,
        message: isRls
          ? 'Submission storage is not configured yet (Supabase policy blocked it). Ask the admin to finish Supabase setup.'
          : message,
      },
      500,
    );
  }
};
