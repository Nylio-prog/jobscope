import type { User } from '@supabase/supabase-js';

import { createSupabaseAnonClient, isSupabaseConfigured } from './supabase';

const moderatorEmails = (import.meta.env.MODERATOR_EMAILS ?? '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

type ModeratorAuthResult =
  | {
      user: User;
      token: string;
    }
  | {
      response: Response;
    };

export async function requireModerator(request: Request): Promise<ModeratorAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      response: json(
        {
          ok: false,
          message:
            'Supabase public config is missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
        },
        503,
      ),
    };
  }

  if (moderatorEmails.length === 0) {
    return {
      response: json(
        {
          ok: false,
          message: 'No moderator emails configured. Set MODERATOR_EMAILS in environment variables.',
        },
        503,
      ),
    };
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return {
      response: json(
        {
          ok: false,
          message: 'Missing bearer token.',
        },
        401,
      ),
    };
  }

  const token = authorization.replace('Bearer ', '').trim();
  if (!token) {
    return {
      response: json(
        {
          ok: false,
          message: 'Invalid bearer token.',
        },
        401,
      ),
    };
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      response: json(
        {
          ok: false,
          message: 'Authentication failed.',
        },
        401,
      ),
    };
  }

  const email = data.user.email?.toLowerCase();
  if (!email || !moderatorEmails.includes(email)) {
    return {
      response: json(
        {
          ok: false,
          message: 'Authenticated user is not an authorized moderator.',
        },
        403,
      ),
    };
  }

  return {
    user: data.user,
    token,
  };
}
