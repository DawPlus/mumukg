'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
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
    <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-[12%] size-64 rounded-full border border-[#D9D8B8] sm:right-[10%]" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full border border-[#D9D8B8] sm:left-[12%]" />
    <section className="relative flex flex-col items-center justify-center text-center">
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.76, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: reduceMotion ? 0 : [0, -7, 0] }}
        transition={{ duration, y: { duration: 2.4, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' } }}
        className="relative grid size-36 place-items-center rounded-full border-2 border-[#4D5B3C] bg-[#D9D8B8] sm:size-40"
      >
        <div className="grid size-24 place-items-center rounded-full border border-[#4D5B3C]/40 sm:size-28">
          <Utensils size={48} strokeWidth={1.6} />
        </div>
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration * 0.55, duration: duration * 0.55 }}
          className="absolute -right-2 -top-1 grid size-12 place-items-center rounded-full bg-[#4D5B3C] text-[#EFE6D4]"
        >
          <MapPin size={23} fill="currentColor" strokeWidth={1.5} />
        </motion.span>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: duration * 0.45, duration }} className="mt-8 text-xs font-bold tracking-[0.3em]">MUMUKG</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: duration * 0.7, duration }} className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">오늘 뭐 먹지?</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: duration, duration }} className="mt-3 text-sm text-[#4D5B3C]/75 sm:text-base">내 맛집을 기록하고, 오늘의 한 끼를 골라봐.</motion.p>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: duration, duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }} className="mt-10 h-1 w-16 origin-left rounded-full bg-[#4D5B3C]/70" />
    </section>
  </main>;
}
