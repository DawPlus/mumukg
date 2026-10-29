'use client';
import { usePathname } from 'next/navigation';
import { PageHeader } from './page-header';
import { TabNav } from './tab-nav';
import { ToastProvider } from './ui/toast';
import { AuthProvider } from './auth/auth-provider';

const pages: Record<string, { title: string; description?: string }> = {
  '/': { title: '맛나보임' },
  '/matnaboim': { title: '맛나보임' },
  '/map': { title: '내 맛집 지도' },
  '/decide': { title: '랜덤메뉴' },
  '/delivery': { title: '냉털' },
  '/restaurants': { title: '맛집 목록', description: '지도에 등록한 식당을 모아서 확인해요.' },
  '/story': { title: '먹스토리' },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const page = pages[pathname] ?? pages['/'];
  const isEntryRoute = pathname === '/splash' || pathname === '/login' || pathname.startsWith('/auth/');

  return (
    <AuthProvider>
      {isEntryRoute ? children : <ToastProvider>
        <div className="min-h-dvh bg-white">
          <PageHeader title={page.title} description={page.description} className="sticky top-0 z-40 shadow-sm" />
          {children}
          <TabNav />
        </div>
      </ToastProvider>}
    </AuthProvider>
  );
}
