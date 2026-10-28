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
    const copies = Math.min(4, Math.max(1, rank.count));
    for (let i = 0; i < copies; i++) images.push(src);
  });
  while (images.length > 0 && images.length < 12) {
    images.push(...images.slice(0, Math.min(images.length, 12 - images.length)));
  }
  return images.slice(0, 24);
}

export function StoryRankCloud({ items }: { items: FoodStory[] }) {
  const ranks = useMemo(() => rankRecentFoods(items, 30), [items]);
  const images = useMemo(() => buildCloudImages(ranks), [ranks]);

  if (!ranks.length || !images.length) return null;

  return (
    <section
      aria-label="최근 30일 자주 먹은 음식"
      className="story-taste mb-6"
    >
      <div className="story-taste__head">
        <h2 className="story-taste__title">최근 입맛</h2>
        <p className="story-taste__sub">지난 30일 · {ranks.length}가지</p>
      </div>
      <div className="story-taste__cloud">
        <IconCloud images={images} showControl={false} />
      </div>
    </section>
  );
}
