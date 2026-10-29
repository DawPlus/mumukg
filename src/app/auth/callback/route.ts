import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/supabase/redirect';

export async function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get('next'), '/');
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');

  try {
    if (supabase && code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.url));
    } else if (supabase && tokenHash && (type === 'email' || type === 'magiclink' || type === 'signup')) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(new URL(next, request.url));
    }
  } catch {
    // Expired links and unavailable Auth should both return to the retry screen.
  }

  const errorUrl = new URL('/auth/error', request.url);
  errorUrl.searchParams.set('next', next);
  errorUrl.searchParams.set('reason', request.nextUrl.searchParams.get('error_code') ?? 'invalid_link');
  return NextResponse.redirect(errorUrl);
}
