'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPinned, UtensilsCrossed, Shuffle, List, Bike } from 'lucide-react';
const tabs = [{href:'/map',name:'지도',Icon:MapPinned},{href:'/',name:'동네밥',Icon:UtensilsCrossed},{href:'/decide',name:'랜덤메뉴',Icon:Shuffle},{href:'/delivery',name:'배달음식',Icon:Bike},{href:'/restaurants',name:'맛집 목록',Icon:List}];
export function TabNav() { const path = usePathname(); return <nav aria-label="메인 메뉴" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid max-w-xl grid-cols-5">{tabs.map(({href,name,Icon}) => <Link key={href} href={href} aria-current={path===href?'page':undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[10px] sm:text-xs ${path===href?'font-bold text-orange-600':'text-slate-500'}`}><Icon size={21}/>{name}</Link>)}</div></nav>; }
