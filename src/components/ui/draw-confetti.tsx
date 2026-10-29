'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Fire a brief celebratory burst when the winning card first mounts.
export function DrawConfetti() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const controller = confetti.create(undefined, { resize: true, useWorker: false });
    const timeout = window.setTimeout(() => {
      void controller({
        particleCount: 85,
        spread: 75,
        startVelocity: 32,
        gravity: 1.05,
        scalar: 0.8,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#E6B65C', '#E9DDBA', '#82985A', '#F7E6CF', '#B88C58'],
        zIndex: 120,
        disableForReducedMotion: true,
      });
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      controller.reset();
    };
  }, []);
  return null;
}
