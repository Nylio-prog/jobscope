import type { APIRoute } from 'astro';
import { z } from 'zod';

import {
  listPendingSubmissions,
  updateSubmissionModeration,
} from '../../lib/job-profiles-repository';
import { requireModerator } from '../../lib/moderation-auth';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

const moderationRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(600).optional(),
});

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireModerator(request);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const pending = await listPendingSubmissions();
    return json({
      ok: true,
      pending,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to load pending submissions.',
      },
      500,
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireModerator(request);
  if ('response' in auth) {
    return auth.response;
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return json(
      {
        ok: false,
        message: 'Use application/json.',
      },
      415,
    );
  }

  const body = await request.json();
  const parsed = moderationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        message: 'Invalid moderation payload.',
        errors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  try {
    const result = await updateSubmissionModeration(
      parsed.data.id,
      parsed.data.status,
      auth.user.id,
      parsed.data.reviewNotes,
    );

    return json({
      ok: true,
      result,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to update moderation status.',
      },
      500,
    );
  }
};
