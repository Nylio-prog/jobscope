import type { APIRoute } from 'astro';

import { buildClientFingerprint } from '../../lib/request-metadata';
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from '../../lib/supabase';
import { logError, logInfo, logWarn } from '../../lib/telemetry';

export const prerender = false;

const EVENT_NAMES = [
  'page_home',
  'page_jobs',
  'page_job_detail',
  'page_share_start',
  'page_share_success',
] as const;

type EventName = (typeof EVENT_NAMES)[number];

type EventPayload = {
  event: EventName;
  path: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function isValidEventPayload(payload: unknown): payload is EventPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<EventPayload>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.length > 0 &&
    typeof candidate.event === 'string' &&
    EVENT_NAMES.includes(candidate.event as EventName)
  );
}

export const POST: APIRoute = async ({ request }) => {
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

  const payload = await request.json();
  if (!isValidEventPayload(payload)) {
    return json(
      {
        ok: false,
        message: 'Invalid event payload.',
      },
      400,
    );
  }

  const fingerprint = buildClientFingerprint(request);
  const eventRecord = {
    event_name: payload.event,
    path: payload.path.slice(0, 240),
    session_id: payload.sessionId?.slice(0, 120) ?? null,
    metadata: payload.metadata ?? null,
    client_fingerprint: fingerprint.slice(0, 220),
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseAdminConfigured()) {
    logInfo('analytics-event-local-log', eventRecord);
    return json({ ok: true, storage: 'log' }, 202);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('analytics_events').insert(eventRecord);
  if (error) {
    const knownMissingTable =
      error.code === '42P01' || error.message.toLowerCase().includes('does not exist');
    if (knownMissingTable) {
      logWarn('analytics-table-missing', {
        message: error.message,
      });
      return json({ ok: true, storage: 'log-fallback' }, 202);
    }

    logError('analytics-write-failed', {
      message: error.message,
    });
    return json(
      {
        ok: false,
        message: 'Event could not be persisted.',
      },
      500,
    );
  }

  return json({
    ok: true,
    storage: 'supabase',
  });
};
