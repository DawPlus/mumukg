'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation } from 'lucide-react';
import { Shell } from '@/components/shell';
import { getNearestRestaurants, loadRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { getFoodIcon } from '@/lib/food-categories';

function distanceLabel(distanceKm: number) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;
}

export default function Home() {
  const [items, setItems] = useState<Restaurant[]>([]);
  const { location, loading, error, locate } = useCurrentLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setItems(loadRestaurants()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const nearby = location ? getNearestRestaurants(items, location.latitude, location.longitude) : [];

  return <Shell>
    {loading ? <p className="py-8 text-center text-sm text-slate-500">현재 위치를 찾는 중…</p> : error ? <div className="rounded-2xl border border-slate-200 p-5 text-center">
      <p className="text-sm text-slate-600">{error}</p>
      <button type="button" onClick={locate} className="mt-3 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">위치 다시 확인</button>
    </div> : nearby.length ? <div className="space-y-3">
      <p className="pb-1 text-xs text-slate-500">가까운 맛집 {nearby.length}곳</p>
      {nearby.map(({ restaurant, distanceKm }, index) => <Link key={restaurant.id} href="/map" className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100"><Image src={getFoodIcon(restaurant.category)} width={24} height={24} alt="" aria-hidden="true"/></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-950">{restaurant.name}</span>
          <span className="mt-1 block truncate text-sm text-slate-500">{restaurant.category}{restaurant.note ? ` · ${restaurant.note}` : ''}</span>
        </span>
        <span className="shrink-0 pt-1 text-xs tabular-nums text-slate-500">{index + 1}위 · {distanceLabel(distanceKm)}</span>
      </Link>)}
    </div> : <div className="rounded-2xl border border-slate-200 p-6 text-center">
      <Navigation className="mx-auto text-slate-400" size={22} aria-hidden="true"/>
      <p className="mt-3 text-sm text-slate-600">아직 등록한 맛집이 없어.</p>
      <Link href="/map" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">지도에서 등록</Link>
    </div>}
  </Shell>;
}
