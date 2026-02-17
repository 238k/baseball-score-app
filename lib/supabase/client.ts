import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { getSupabaseEnv } from './env';

// ブラウザ用シングルトン Supabase クライアント
// Client Component から使用する
export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
  );
}
