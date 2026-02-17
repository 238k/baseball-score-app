interface SupabaseEnv {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      'Please set it in .env.local.'
    );
  }

  return value;
}

export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL'
  );
  const isPlaceholderUrl = supabaseUrl.includes('your-project-id.supabase.co');
  if (isPlaceholderUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is still using a placeholder value. ' +
      'Set your real Supabase project URL in .env.local.'
    );
  }

  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabasePublishableKey) {
    throw new Error(
      'Missing Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
      'or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
