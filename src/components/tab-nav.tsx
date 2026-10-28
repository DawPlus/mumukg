'use client';
import type { CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import GooeyNav from './gooey-nav';
const tabs = [
  { href: '/map', name: '지도', emoji: '🗺️' },
  { href: '/matnaboim', name: '맛나보임', emoji: '🍽️' },
  { href: '/decide', name: '랜덤메뉴', emoji: '🎲' },
  { href: '/delivery', name: '배달음식', emoji: '🛵' },
  { href: '/story', name: '먹스토리', emoji: '📖' },
];

const items = tabs.map(({ href, name, emoji }) => ({
  href,
  label: name,
  icon: <span className="text-xl leading-none" aria-hidden="true">{emoji}</span>,
}));

export function TabNav() {
  const path = usePathname();
  const activePath = tabs.some(({ href }) => href === path) ? path : '/matnaboim';

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-[#d9d8b8] bg-[#efe6d4] pb-[env(safe-area-inset-bottom)]">
      <GooeyNav
        items={items}
        activeIndex={tabs.findIndex(({ href }) => href === activePath)}
        theme="light"
        color="#4d5b3c"
        activeTextColor="#f7f5ef"
        frame={false}
        hoverEffect={false}
        particleCount={9}
        spread={16}
        wobble={0.65}
        gooeyness={0.25}
        timeVariance={550}
        className="w-full [&_a]:min-h-16"
        style={{
          '--gn-font': '10px',
          '--gn-gap': '0px',
          '--gn-x': '4px',
          '--gn-y': '12px',
          '--gn-ink': '#4d5b3c',
          '--gn-muted': 'rgba(77, 91, 60, 0.7)',
        } as CSSProperties}
      />
    </div>
  );
}
