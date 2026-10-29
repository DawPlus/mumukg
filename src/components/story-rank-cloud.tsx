'use client';

import { useMemo } from 'react';
import { IconCloud } from '@/components/ui/icon-cloud';
import { getFoodIcon } from '@/lib/food-categories';
import {
  foodIconPath,
  rankRecentCategories,
  rankRecentFoods,
} from '@/lib/story';
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
  const ranks = useMemo(() => rankRecentFoods(items, 7), [items]);
  const categories = useMemo(
    () => rankRecentCategories(items, 7).slice(0, 4),
    [items],
  );
  const images = useMemo(() => buildCloudImages(ranks), [ranks]);

  const cloudImages = images.length ? images : ['한식', '중식', '일식', '양식', '디저트', '기타'].map(category => getFoodIcon(category));

  return (
    <section
      aria-label="최근 7일 자주 먹은 음식"
      className="story-taste mb-6"
    >
      <div className="story-taste__head">
        <h2 className="story-taste__title">최근 입맛</h2>
        <p className="story-taste__sub">지난 일주일 · {ranks.length ? `${ranks.length}가지` : '첫 기록을 기다리는 중'}</p>
      </div>
      {categories.length ? (
        <ul className="story-taste__categories" aria-label="많이 먹은 카테고리">
          {categories.map((rank, index) => (
            <li
              key={rank.category}
              className={`story-taste__category${index === 0 ? ' story-taste__category--top' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFoodIcon(rank.category)}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] shrink-0"
              />
              <span className="story-taste__category-name">{rank.category}</span>
              <span className="story-taste__category-count">{rank.count}회</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="story-taste__cloud">
        <IconCloud images={cloudImages} showControl={false} />
      </div>
    </section>
  );
}
