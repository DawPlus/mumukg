'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/supabase/redirect';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  available: boolean;
  signInOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  signInWithOtp: (email: string, returnTo?: string) => Promise<string | null>;
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);
  const supabase = createClient();
  const openSignIn = useCallback(() => setSignInOpen(true), []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setUser(error ? null : data.user);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setUser(null);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithOtp = useCallback(async (email: string, returnTo?: string) => {
    if (!supabase) return 'Supabase 환경변수 설정이 필요해.';
    const next = safeRedirectPath(returnTo, '/');
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callback.toString() },
      });
      return error?.message ?? null;
    } catch {
      return '로그인 요청에 실패했어. 잠시 후 다시 시도해 줘.';
    }
  }, [supabase]);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return 'Supabase 환경변수 설정이 필요해.';
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
      return error?.message ?? null;
    } catch {
      return '인증번호 확인에 실패했어. 다시 시도해 줘.';
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return null;
    try {
      const { error } = await supabase.auth.signOut();
      return error?.message ?? null;
    } catch {
      return '로그아웃에 실패했어. 잠시 후 다시 시도해 줘.';
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading: Boolean(supabase && loading), available: Boolean(supabase), signInOpen,
    openSignIn,
    closeSignIn,
    signInWithOtp, verifyEmailOtp, signOut,
  }), [user, loading, supabase, signInOpen, openSignIn, closeSignIn, signInWithOtp, verifyEmailOtp, signOut]);

  return <AuthContext.Provider value={value}>{children}{signInOpen && <AuthDialog />}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function AuthDialog() {
  const { user, closeSignIn, signInWithOtp, verifyEmailOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (user) closeSignIn();
  }, [user, closeSignIn]);
  const returnTo = typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search;
  const submitLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const error = await signInWithOtp(email, returnTo);
    setBusy(false);
    setMessage(error ?? '로그인 링크를 보냈어. 메일을 열거나 인증번호를 입력해 줘.');
    if (!error) setSent(true);
  };
  const submitToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const error = await verifyEmailOtp(email, token);
    setBusy(false);
    setMessage(error ?? '인증됐어.');
    if (!error) closeSignIn();
  };

  return <dialog ref={dialogRef} aria-labelledby="auth-dialog-title" onCancel={(event) => { event.preventDefault(); closeSignIn(); }} onClick={(event) => { if (event.target === event.currentTarget) closeSignIn(); }} className="fixed inset-x-0 bottom-0 m-0 h-fit w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/40 sm:inset-0 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md">
    <section className="rounded-t-3xl bg-[#f7f5ef] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[#4D5B3C] shadow-xl sm:rounded-3xl sm:pb-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="auth-dialog-title" className="text-lg font-bold">이메일로 로그인</h2>
        <button type="button" onClick={closeSignIn} aria-label="로그인 창 닫기" className="rounded-full px-3 py-2 text-xl">×</button>
      </div>
      {!sent ? <form onSubmit={submitLink} className="space-y-3">
        <label htmlFor="auth-email" className="sr-only">이메일 주소</label>
        <input id="auth-email" type="email" autoComplete="email" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일 주소" className="min-h-12 w-full rounded-xl border border-[#D9D8B8] bg-white px-4 text-base" />
        <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-[#4D5B3C] px-4 font-bold text-[#EFE6D4] disabled:opacity-50">{busy ? '보내는 중…' : '로그인 링크 받기'}</button>
      </form> : <form onSubmit={submitToken} className="space-y-3">
        <p className="text-sm">{email} 주소로 링크를 보냈어. 이메일 템플릿이 인증번호를 제공하면 아래에 입력할 수 있어.</p>
        <label htmlFor="auth-otp" className="sr-only">이메일 인증번호</label>
        <input id="auth-otp" inputMode="numeric" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="인증번호 (선택)" className="min-h-12 w-full rounded-xl border border-[#D9D8B8] bg-white px-4 text-base" />
        <button type="submit" disabled={busy || !token.trim()} className="min-h-12 w-full rounded-xl bg-[#4D5B3C] px-4 font-bold text-[#EFE6D4] disabled:opacity-50">{busy ? '확인 중…' : '인증번호 확인'}</button>
        <button type="button" disabled={busy} onClick={() => { setSent(false); setMessage(''); }} className="min-h-10 w-full text-sm underline">이메일 다시 입력</button>
      </form>}
      {message && <p role="status" className="mt-3 break-words text-sm">{message}</p>}
    </section>
  </dialog>;
}
