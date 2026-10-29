'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { MapPin, Utensils } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function SplashPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/map');
      return;
    }
    const timer = window.setTimeout(() => router.replace('/login'), reduceMotion ? 250 : 1500);
    return () => window.clearTimeout(timer);
  }, [loading, reduceMotion, router, user]);

  const duration = reduceMotion ? 0 : 0.7;

  return <main className="relative grid min-h-dvh overflow-hidden bg-[#EFE6D4] px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] text-[#4D5B3C]">
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[12%] size-64 rounded-full border border-[#D9D8B8] sm:right-[10%]"/>
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full border border-[#D9D8B8] sm:left-[12%]"/>
    <section className="relative flex flex-col items-center justify-center text-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration, type: 'spring', bounce: 0.25 }}
        className="relative w-[clamp(162px,27dvh,230px)]"
      >
        <motion.div animate={reduceMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Image src="/asset/mumukg.png" alt="뭐 먹을지 고민하는 머먹쥐 캐릭터" width={256} height={256} priority className="h-auto w-full rounded-2xl" sizes="230px"/>
        </motion.div>
        <motion.div
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.5, rotate: 12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.25, duration: reduceMotion ? 0 : 0.5, type: 'spring', bounce: 0.3 }}
          className="absolute -right-6 -top-8 grid size-16 place-items-center rounded-full border-2 border-[#929D78] bg-[#D9D8B8]"
        >
          <div className="grid size-11 place-items-center rounded-full border border-[#929D78]/60"><Utensils size={23} strokeWidth={1.6}/></div>
          <span className="absolute -right-1 -top-2 grid size-7 place-items-center rounded-full bg-[#4D5B3C] text-[#EFE6D4]"><MapPin size={15} strokeWidth={1.8}/></span>
        </motion.div>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: duration * 0.45, duration }} className="mt-8 text-xs font-bold tracking-[0.3em]">머먹쥐</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: duration * 0.7, duration }} className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">오늘 뭐 먹지?</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: duration, duration }} className="mt-3 text-sm text-[#4D5B3C]/75 sm:text-base">내 맛집을 기록하고, 오늘의 한 끼를 골라봐.</motion.p>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: duration, duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }} className="mt-10 h-1 w-16 origin-left rounded-full bg-[#4D5B3C]/70" />
    </section>
  </main>;
}
