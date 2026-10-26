'use client';

import { useMemo } from 'react';
import { IconCloud } from '@/components/ui/icon-cloud';
import { foodIconPath, rankRecentFoods } from '@/lib/story';
import type { FoodStory } from '@/lib/types';

function buildCloudImages(ranks: ReturnType<typeof rankRecentFoods>): string[] {
  const top = ranks.slice(0, 12);
  const images: string[] = [];
  top.forEach((rank) => {
    const src = foodIconPath(rank.icon);
    const copies = Math.min(5, Math.max(1, rank.count));
    for (let i = 0; i < copies; i++) images.push(src);
  });
  while (images.length > 0 && images.length < 12) {
    images.push(...images.slice(0, Math.min(images.length, 12 - images.length)));
  }
  return images.slice(0, 28);
}

export function StoryRankCloud({ items }: { items: FoodStory[] }) {
  const ranks = useMemo(() => rankRecentFoods(items, 30), [items]);
  const images = useMemo(() => buildCloudImages(ranks), [ranks]);

  if (!ranks.length || !images.length) return null;

  return (
    <section className="mb-8">
      <div className="relative mx-auto flex w-full justify-center">
        <IconCloud images={images} showControl={false} />
      </div>
    </section>
  );
}
