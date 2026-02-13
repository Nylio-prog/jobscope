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
