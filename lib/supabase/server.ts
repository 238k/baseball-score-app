import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { getSupabaseEnv } from './env';

// サーバーサイド用 Supabase クライアント
// Server Component・Route Handler・middleware から使用する
export async function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component からの呼び出しでは set が不要なため無視
          }
        },
      },
    },
  );
}
