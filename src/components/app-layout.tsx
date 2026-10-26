'use client';
import { usePathname } from 'next/navigation';
import { PageHeader } from './page-header';
import { TabNav } from './tab-nav';

const pages: Record<string, { title: string; description?: string }> = {
  '/': { title: '근처밥집' },
  '/map': { title: '내 맛집 지도' },
  '/decide': { title: '랜덤메뉴', description: '고민될 땐 재미있게 골라보자!' },
  '/delivery': { title: '배달음식', description: '오늘 집에서 뭐 시켜 먹을까?' },
  '/restaurants': { title: '맛집 목록', description: '지도에 등록한 식당을 모아서 확인해요.' },
  '/story': { title: '먹스토리' },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const page = pages[pathname] ?? pages['/'];

  return (
    <div className="min-h-dvh bg-white">
      <PageHeader title={page.title} description={page.description} className="sticky top-0 z-40 shadow-sm"/>
      {children}
      <TabNav/>
    </div>
  );
}
