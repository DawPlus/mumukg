'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MapPin, Utensils } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

const development = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, loading, available, openSignIn } = useAuth();

  useEffect(() => {
    if (user) router.replace('/map');
  }, [router, user]);

  const start = () => {
    if (development) {
      router.replace('/map');
      return;
    }
    openSignIn();
  };

  return <main className="grid min-h-dvh bg-[#EFE6D4] px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] text-[#4D5B3C] sm:px-8">
    <section className="mx-auto flex w-full max-w-md flex-col justify-between py-3 sm:max-w-lg sm:py-8">
      <div className="flex items-center gap-2 text-sm font-extrabold tracking-wide">
        <MapPin size={19} strokeWidth={2.5} /> MUMUKG
      </div>
      <div className="py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.5 }} className="mb-9 flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full border border-[#4D5B3C]/40 bg-[#D9D8B8]">
            <Utensils size={30} strokeWidth={1.7} />
          </div>
          <div className="h-px flex-1 bg-[#4D5B3C]/20" />
          <MapPin size={20} className="shrink-0" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.08, duration: reduceMotion ? 0 : 0.5 }} className="max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">
          나만의 맛집 지도를<br />시작해 볼까?
        </motion.h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-[#4D5B3C]/75 sm:text-base">좋았던 식당은 오래 기억하고, 다음 메뉴는 가볍게 골라봐.</p>
      </div>
      <div>
        <button type="button" disabled={loading || (!development && !available)} onClick={start} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-[#4D5B3C] px-5 text-left font-bold text-[#EFE6D4] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
          <span>{loading ? '로그인 확인 중…' : development ? '로그인하고 시작하기' : '이메일로 로그인하기'}</span>
          <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p role="status" className="mt-3 min-h-5 text-center text-xs text-[#4D5B3C]/65">
          {development ? '개발 모드에서는 인증 없이 바로 시작해.' : available ? '이메일 링크로 간편하게 로그인해.' : '로그인 설정이 아직 준비되지 않았어.'}
        </p>
      </div>
    </section>
  </main>;
}
