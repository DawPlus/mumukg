'use client';
import { usePathname, useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import GooeyNav from './gooey-nav';
import { MapPinned, UtensilsCrossed, Shuffle, Bike, BookOpen } from 'lucide-react';

const tabs = [
  { href: '/map', name: '지도', Icon: MapPinned },
  { href: '/', name: '근처밥집', Icon: UtensilsCrossed },
  { href: '/decide', name: '랜덤메뉴', Icon: Shuffle },
  { href: '/delivery', name: '배달음식', Icon: Bike },
  { href: '/story', name: '먹스토리', Icon: BookOpen },
];

export function TabNav() {
  const path = usePathname();
  const router = useRouter();
  const activeIndex = Math.max(0, tabs.findIndex(({ href }) => href === path));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d9d8b8] bg-[#efe6d4] pb-[env(safe-area-inset-bottom)]">
      <GooeyNav
        items={tabs.map(({ name, Icon }) => ({ label: name, icon: <Icon aria-hidden="true"/> }))}
        activeIndex={activeIndex}
        onChange={(index) => router.push(tabs[index].href)}
        theme="light"
        color="#4d5b3c"
        activeTextColor="#f7f5ef"
        size="lg"
        frame={false}
        particleCount={9}
        spread={16}
        wobble={0.65}
        gooeyness={0.25}
        timeVariance={550}
        hoverEffect={false}
        className="!flex !w-full !max-w-none !justify-center !rounded-none !p-0"
        style={{ '--gn-pad': '2px', '--gn-gap': '0px', '--gn-font': '10px', '--gn-x': '2px', '--gn-y': '12px' } as CSSProperties}
      />
    </div>
  );
}
