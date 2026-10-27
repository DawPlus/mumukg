'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Tabs,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
} from '@animate-ui/react/primitives/tabs';
import { MapPinned, HandCoins, Shuffle, Bike, BookOpen } from 'lucide-react';

const tabs = [
  { href: '/map', name: '지도', Icon: MapPinned },
  { href: '/', name: '누가삼?', Icon: HandCoins },
  { href: '/decide', name: '랜덤메뉴', Icon: Shuffle },
  { href: '/delivery', name: '배달음식', Icon: Bike },
  { href: '/story', name: '먹스토리', Icon: BookOpen },
];

export function TabNav() {
  const path = usePathname();
  const activePath = tabs.some(({ href }) => href === path) ? path : '/';

  return (
    <Tabs
      value={activePath}
      className="fixed inset-x-0 bottom-0 z-50 w-full"
    >
      <nav aria-label="메인 메뉴" className="border-t border-[#d9d8b8] bg-[#efe6d4] pb-[env(safe-area-inset-bottom)]">
        <TabsHighlight className="absolute inset-x-1 inset-y-1 rounded-2xl bg-[#4d5b3c]">
          <TabsList role="none" className="flex w-full">
          {tabs.map(({ href, name, Icon }) => (
            <TabsHighlightItem key={href} value={href} className="min-w-0 flex-1">
              <Link href={href} aria-current={activePath === href ? 'page' : undefined} className={`relative z-10 flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 py-3 text-[10px] font-medium ${activePath === href ? 'text-[#f7f5ef]' : 'text-[#4d5b3c]/70'}`}>
                <Icon className="size-5" aria-hidden="true" />
                <span className="whitespace-nowrap">{name}</span>
              </Link>
            </TabsHighlightItem>
          ))}
          </TabsList>
        </TabsHighlight>
      </nav>
    </Tabs>
  );
}
