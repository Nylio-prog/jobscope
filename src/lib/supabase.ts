import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function assertPublicConfig(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase public config is missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

function assertAdminConfig(): { url: string; serviceRoleKey: string } {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Supabase admin config is missing. Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  if (supabaseServiceRoleKey.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use the service_role secret key from Supabase Project Settings -> API.',
    );
  }

  if (supabaseServiceRoleKey.startsWith('eyJ')) {
    try {
      const [, payloadPart] = supabaseServiceRoleKey.split('.');
      const payload = JSON.parse(
        Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
      ) as { role?: string };

      if (payload.role === 'anon') {
        throw new Error(
          'SUPABASE_SERVICE_ROLE_KEY is an anon JWT. Use the service_role key from Supabase Project Settings -> API.',
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
    }
  }

  return {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
  };
}

export function createSupabaseAnonClient() {
  const { url, anonKey } = assertPublicConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = assertAdminConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
