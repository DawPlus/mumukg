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
  const signInPending = useRef(false);

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
    if (signInPending.current) return null;
    signInPending.current = true;
    const next = safeRedirectPath(returnTo, '/');
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: callback.toString() },
      });
      if (error) signInPending.current = false;
      return error?.message ?? null;
    } catch {
      signInPending.current = false;
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
    user, loading: Boolean(supabase && loading), profileReady, available: Boolean(supabase),
    signInWithKakao, signOut,
  }), [user, loading, profileReady, supabase, signInWithKakao, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
