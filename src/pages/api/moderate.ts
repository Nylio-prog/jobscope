import type { APIRoute } from 'astro';
import { z } from 'zod';

import {
  type PendingListSort,
  listPendingSubmissions,
  updateSubmissionModeration,
} from '../../lib/job-profiles-repository';
import { requireModerator } from '../../lib/moderation-auth';
import { logError, logInfo } from '../../lib/telemetry';

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
  ids: z.array(z.string().uuid()).max(50).optional(),
  id: z.string().uuid().optional(),
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(600).optional(),
});

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireModerator(request);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const params = new URL(request.url).searchParams;
    const sort = (params.get('sort') ?? 'newest') as PendingListSort;
    const industry = params.get('industry') ?? undefined;
    const submitterType = params.get('submitterType') ?? undefined;
    const limit = Number(params.get('limit') ?? '50');
    const offset = Number(params.get('offset') ?? '0');

    const pendingResult = await listPendingSubmissions({
      sort: ['newest', 'oldest', 'flagged'].includes(sort) ? sort : 'newest',
      industry,
      submitterType,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return json({
      ok: true,
      pending: pendingResult.items,
      total: pendingResult.total,
      metrics: pendingResult.metrics,
      filters: {
        sort,
        industry,
        submitterType,
        limit,
        offset,
      },
    });
  } catch (error) {
    logError('moderation-get-failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
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

  const ids = parsed.data.ids?.length ? parsed.data.ids : parsed.data.id ? [parsed.data.id] : [];
  if (ids.length === 0) {
    return json(
      {
        ok: false,
        message: 'Provide id or ids in moderation payload.',
      },
      400,
    );
  }

  try {
    const results = [];
    for (const id of ids) {
      const result = await updateSubmissionModeration(
        id,
        parsed.data.status,
        auth.user.id,
        parsed.data.reviewNotes,
      );
      results.push(result);
    }
    logInfo('moderation-update-completed', {
      moderatorId: auth.user.id,
      count: results.length,
      status: parsed.data.status,
    });

    return json({
      ok: true,
      results,
    });
  } catch (error) {
    logError('moderation-update-failed', {
      message: error instanceof Error ? error.message : 'unknown',
      moderatorId: auth.user.id,
      idsCount: ids.length,
    });
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to update moderation status.',
      },
      500,
    );
  }
};
