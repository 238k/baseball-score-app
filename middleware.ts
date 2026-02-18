import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションを更新（重要: getUser() を呼ぶことで JWT が自動更新される）
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // リダイレクト時にもリフレッシュ済みクッキーを引き継ぐヘルパー
  function redirectWithCookies(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });
    return redirectResponse;
  }

  // 未認証: `/` と `/games/**` は /login へリダイレクト
  const isProtected = pathname === '/' || pathname.startsWith('/games');
  if (isProtected && !user) {
    return redirectWithCookies('/login');
  }

  // 認証済み: ログイン・サインアップページは / へリダイレクト
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isAuthPage && user) {
    return redirectWithCookies('/');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 静的ファイルと Next.js 内部パスは除外
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
