import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '뭐먹지? | 나의 맛집 지도', description: '맛집을 기록하고 오늘의 한 끼를 결정해요.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
