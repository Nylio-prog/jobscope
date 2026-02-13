import type { APIRoute } from 'astro';

import { createPendingSubmission } from '../../lib/job-profiles-repository';
import {
  assessSubmissionForModeration,
  normalizeSubmission,
  validateShareSubmission,
} from '../../lib/submission';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
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
    });
  } catch (error) {
    return json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Submission could not be persisted. Please try again.',
      },
      500,
    );
  }
};
