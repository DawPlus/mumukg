'use client';

import { useEffect, useRef } from 'react';

type Point = { x: number; y: number };
type Bolt = { lines: Point[][]; born: number; life: number; strength: number };

function generateBolt(width: number, height: number): Point[][] {
  const startX = width * (Math.random() < 0.5 ? -0.12 + Math.random() * 0.35 : 0.75 + Math.random() * 0.38);
  const endX = width * (0.2 + Math.random() * 0.6);
  const count = 11 + Math.floor(Math.random() * 7);
  const main: Point[] = [];
  for (let i = 0; i <= count; i++) {
    const progress = i / count;
    main.push({
      x: startX + (endX - startX) * progress + (Math.random() - 0.5) * width * 0.22 * Math.sin(Math.PI * progress),
      y: -15 + (height + 30) * progress,
    });
  }
  const lines = [main];
  for (let i = 2; i < count - 2; i += 2 + Math.floor(Math.random() * 3)) {
    if (Math.random() > 0.8) continue;
    const p = main[i];
    const sign = Math.random() > 0.5 ? 1 : -1;
    const length = width * (0.08 + Math.random() * 0.14);
    lines.push([
      p,
      { x: p.x + sign * length * 0.45, y: p.y + height * 0.05 },
      { x: p.x + sign * length, y: p.y + height * (0.11 + Math.random() * 0.06) },
    ]);
  }
  return lines;
}

export default function LightningReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 1;
    let height = 1;
    let raf = 0;
    let lastBolt = 0;
    let active: Bolt[] = [];
    const started = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const trace = (points: Point[]) => {
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
    };

    const frame = (now: number) => {
      context.clearRect(0, 0, width, height);
      if (!reduced && now - lastBolt > 360 + Math.random() * 480) {
        active.push({ lines: generateBolt(width, height), born: now, life: 130 + Math.random() * 150, strength: 0.65 + Math.random() * 0.35 });
        if (Math.random() > 0.55) active.push({ lines: generateBolt(width, height), born: now + 45, life: 160, strength: 0.55 });
        lastBolt = now;
      }

      active = active.filter(bolt => now < bolt.born + bolt.life);
      for (const bolt of active) {
        if (now < bolt.born) continue;
        const progress = (now - bolt.born) / bolt.life;
        const opacity = Math.pow(1 - progress, 1.7) * bolt.strength;
        for (const [index, line] of bolt.lines.entries()) {
          trace(line);
          context.strokeStyle = `rgba(83, 109, 170, ${opacity * 0.65})`;
          context.lineWidth = index ? 7 : 14;
          context.shadowBlur = index ? 9 : 19;
          context.shadowColor = '#7797dd';
          context.stroke();

          trace(line);
          context.shadowBlur = 5;
          context.strokeStyle = `rgba(150, 176, 238, ${opacity * 0.9})`;
          context.lineWidth = index ? 2 : 4;
          context.stroke();

          trace(line);
          context.shadowBlur = 0;
          context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          context.lineWidth = index ? 0.7 : 1.5;
          context.stroke();
        }
      }
      context.shadowBlur = 0;
      if (reduced) {
        if (now - started < 100) return;
      } else if (document.visibilityState !== 'hidden') raf = requestAnimationFrame(frame);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (reduced) {
      active = [{ lines: generateBolt(width, height), born: 0, life: Number.MAX_SAFE_INTEGER, strength: 0.3 }];
      // Reduced motion stays on a calm gradient; no flashing animation.
    } else raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#F9FAF2_8%,#D7D9CE_52%,#AEBACA_100%)]" />
      <div className="absolute inset-0 opacity-65 bg-[radial-gradient(ellipse_at_85%_5%,#9AAFE5_0%,transparent_58%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 size-full motion-reduce:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#F9F6EA]/20 via-transparent to-[#E6E3D7]/20" />
    </div>
  );
}
