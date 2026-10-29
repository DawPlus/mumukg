'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';

export function AuthControl() {
  const { user, loading, available, signInWithKakao, signOut } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    const error = await signInWithKakao(window.location.pathname + window.location.search);
    if (error) { setMessage(error); setBusy(false); }
  };

  const logout = async () => {
    setBusy(true);
    const error = await signOut();
    setBusy(false);
    setMessage(error ?? '로그아웃했어.');
  };

  if (!available) return <span className="shrink-0 text-xs text-[#747665]">인증 설정 필요</span>;
  return <div className="flex shrink-0 flex-col items-end">
    {loading ? <span className="text-xs text-[#747665]">확인 중…</span> : user ? <div className="flex items-center gap-2">
      <span className="hidden max-w-28 truncate text-xs text-[#747665] sm:block">{user.email}</span>
      <button type="button" disabled={busy} onClick={() => void logout()} className="min-h-9 rounded-full border border-[#D9D8B8] px-3 text-xs font-semibold text-[#4D5B3C] disabled:opacity-50">{busy ? '처리 중…' : '로그아웃'}</button>
    </div> : <button type="button" disabled={busy} onClick={() => void login()} className="min-h-9 rounded-full bg-[#4D5B3C] px-4 text-xs font-bold text-[#EFE6D4]">{busy ? '이동 중…' : '카카오 로그인'}</button>}
    {message && <span role="status" className="mt-2 max-w-52 text-xs text-red-700">{message}</span>}
  </div>;
}
