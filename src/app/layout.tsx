import type { Metadata, Viewport } from 'next';
import { AppLayout } from '@/components/app-layout';
import './globals.css';

export const metadata: Metadata = {
  title: '뭐먹지? | 나의 맛집 지도',
  description: '맛집을 기록하고 오늘의 한 끼를 결정해요.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="font-sans" suppressHydrationWarning>
      <head>
      </head>
      <body><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
