'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MapPin, Utensils } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SplittingText } from '@animate-ui/react/primitives/texts/splitting';
import { useAuth } from '@/components/auth/auth-provider';


export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, loading, available, signInWithKakao } = useAuth();

  useEffect(() => {
    if (user) router.replace('/map');
  }, [router, user]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const start = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const message = await signInWithKakao('/map');
    if (message) { setError(message); setBusy(false); }
  };

  return <main className="grid min-h-dvh bg-[#EFE6D4] px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] text-[#4D5B3C] sm:px-8">
    <section className="mx-auto flex w-full max-w-md flex-col justify-between py-3 sm:max-w-lg sm:py-8">
      <div className="flex items-center gap-3 text-sm font-extrabold tracking-wide">
        <span aria-hidden="true" className="relative grid size-8 shrink-0 place-items-center rounded-full border-2 border-[#929D78] bg-[#D9D8B8]">
          <span className="grid size-6 place-items-center rounded-full border border-[#929D78]/60"><Utensils size={14} strokeWidth={1.6}/></span>
          <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-[#4D5B3C] text-[#EFE6D4]"><MapPin size={9} strokeWidth={1.8}/></span>
        </span>
        <span>머먹쥐</span>
      </div>
      <div className="py-7 text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55 }}
          className="mx-auto mb-8 w-[clamp(144px,24.3dvh,216px)]"
        >
          <motion.div animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, -1.5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Image src="/asset/mumukg.png" alt="뭐 먹을지 고민하는 머먹쥐 캐릭터" width={256} height={256} priority className="h-auto w-full rounded-2xl" sizes="216px"/>
          </motion.div>
        </motion.div>
        <h1 className="sr-only">나만의 맛집 지도를 시작해 볼까?</h1>
        <div aria-hidden="true" className="mx-auto max-w-sm text-[28px] font-bold leading-[1.3] tracking-tight sm:text-[32px]">
          <SplittingText className="block" text="나만의 맛집 지도를" type="chars" delay={150} stagger={0.045} initial={{ opacity: 0, y: 18, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} disableAnimation={!!reduceMotion}/>
          <SplittingText className="block" text="시작해 볼까?" type="chars" delay={650} stagger={0.055} initial={{ opacity: 0, y: 18, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} disableAnimation={!!reduceMotion}/>
        </div>
        <SplittingText text="좋았던 식당은 오래 기억하고, 다음 메뉴는 가볍게 골라봐." type="words" delay={950} stagger={0.06} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} disableAnimation={!!reduceMotion} className="mx-auto mt-3 block max-w-[270px] text-sm leading-6 text-[#4D5B3C]/75"/>

      </div>
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }} className="w-full">
        <button type="button" disabled={loading || busy || !available} onClick={() => void start()} className="group flex min-h-14 w-full items-center justify-between rounded-2xl bg-[#4D5B3C] px-5 text-left font-bold text-[#EFE6D4] transition-[transform,background-color] hover:bg-[#3E4C30] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4D5B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
          <span>{loading ? '로그인 확인 중…' : busy ? '카카오로 이동 중…' : '카카오로 로그인하기'}</span>
          <ArrowRight size={20} aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
        </button>
        <Link href="/map" replace className="mt-2 flex min-h-11 items-center justify-center rounded-xl text-sm text-[#4D5B3C]/75 underline-offset-4 transition-colors hover:text-[#4D5B3C] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4D5B3C]">
          로그인 건너뛰기
        </Link>
        <p role="status" className="mt-3 min-h-5 text-center text-xs text-[#4D5B3C]/65">
          {error || (available ? '카카오 계정으로 간편하게 로그인해.' : '로그인 설정이 아직 준비되지 않았어.')}
        </p>
      </motion.div>
    </section>
  </main>;
}
