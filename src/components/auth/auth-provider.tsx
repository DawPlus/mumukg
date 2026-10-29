'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/supabase/redirect';
import { syncProfile } from '@/lib/supabase/profile';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  profileReady: boolean;
  available: boolean;
  signInOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
  signInWithKakao: (returnTo?: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [profileSyncSettledFor, setProfileSyncSettledFor] = useState<string | null>(null);
  const profileReady = !supabase || !user || profileSyncSettledFor === user.id;
  const [signInOpen, setSignInOpen] = useState(false);
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

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void syncProfile(supabase, user).catch(() => undefined).finally(() => {
      if (active) setProfileSyncSettledFor(user.id);
    });
    return () => { active = false; };
  }, [supabase, user]);

  const signInWithKakao = useCallback(async (returnTo?: string) => {
    if (!supabase) return 'Supabase 환경변수 설정이 필요해.';
    const next = safeRedirectPath(returnTo, '/');
    const callback = window.MumukgNative?.isNative
      ? new URL('mumukg://auth/callback')
      : new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: callback.toString() },
      });
      return error?.message ?? null;
    } catch {
      return '로그인 요청에 실패했어. 잠시 후 다시 시도해 줘.';
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
    user, loading: Boolean(supabase && loading), profileReady, available: Boolean(supabase), signInOpen,
    openSignIn,
    closeSignIn,
    signInWithKakao, signOut,
  }), [user, loading, profileReady, supabase, signInOpen, openSignIn, closeSignIn, signInWithKakao, signOut]);

  return <AuthContext.Provider value={value}>{children}{signInOpen && <AuthDialog />}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function AuthDialog() {
  const { user, closeSignIn, signInWithKakao } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (user) closeSignIn();
  }, [user, closeSignIn]);
  const returnTo = typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search;
  const submitKakao = async () => {
    setBusy(true);
    setMessage('');
    const error = await signInWithKakao(returnTo);
    setBusy(false);
    if (error) setMessage(error);
  };

  return <dialog ref={dialogRef} aria-labelledby="auth-dialog-title" onCancel={(event) => { event.preventDefault(); closeSignIn(); }} onClick={(event) => { if (event.target === event.currentTarget) closeSignIn(); }} className="fixed inset-x-0 bottom-0 m-0 h-fit w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/40 sm:inset-0 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md">
    <section className="rounded-t-3xl bg-[#f7f5ef] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[#4D5B3C] shadow-xl sm:rounded-3xl sm:pb-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="auth-dialog-title" className="text-lg font-bold">로그인</h2>
        <button type="button" onClick={closeSignIn} aria-label="로그인 창 닫기" className="rounded-full px-3 py-2 text-xl">×</button>
      </div>
      <button type="button" disabled={busy} onClick={() => { void submitKakao(); }} className="min-h-12 w-full rounded-xl bg-[#4D5B3C] px-4 font-bold text-[#EFE6D4] disabled:opacity-50">
        {busy ? '카카오로 이동 중…' : '카카오로 로그인'}
      </button>
      {message && <p role="status" className="mt-3 break-words text-sm">{message}</p>}
    </section>
  </dialog>;
}
