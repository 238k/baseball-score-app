import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// ブラウザ用シングルトン Supabase クライアント
// Client Component から使用する
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
