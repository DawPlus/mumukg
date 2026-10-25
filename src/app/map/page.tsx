'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Shell } from '@/components/shell';
import { loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';

declare global { interface Window { kakao?: { maps: { load: (callback: () => void) => void; Map: new (element: HTMLElement, options: object) => { setCenter: (position: unknown) => void }; LatLng: new (lat: number, lng: number) => unknown; Marker: new (options: object) => unknown; event: { addListener: (target: object, event: string, callback: (event: { latLng: { getLat: () => number; getLng: () => number } }) => void) => void } } } } }
const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
export default function MapPage() {
  const [items,setItems]=useState<Restaurant[]>([]);
  const [ready,setReady]=useState(false);
  const [name,setName]=useState('');
  const [category,setCategory]=useState('한식');
  const [note,setNote]=useState('');
  const [lat,setLat]=useState(37.5495);
  const [lng,setLng]=useState(126.914);
  const [error,setError]=useState('');
  useEffect(()=>{ const frame=requestAnimationFrame(()=>setItems(loadRestaurants()));return ()=>cancelAnimationFrame(frame); },[]);
  useEffect(()=>{
    const maps=window.kakao?.maps;
    const node=document.getElementById('restaurant-map');
    if (!ready||!maps||!node)return;
    maps.load(()=>{
      const map=new maps.Map(node,{center:new maps.LatLng(lat,lng),level:5});
      maps.event.addListener(map,'click',(event)=>{setLat(event.latLng.getLat());setLng(event.latLng.getLng());});
      items.forEach(item=>new maps.Marker({map,position:new maps.LatLng(item.latitude,item.longitude),title:item.name}));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,items]); // map recreated after saving to refresh pins
  function add() {
    if (!name.trim()) {setError('식당 이름을 입력해 줘.');return;}
    if (!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180){setError('좌표를 확인해 줘.');return;}
    const item:Restaurant={id:crypto.randomUUID(),name:name.trim(),category,note:note.trim(),latitude:lat,longitude:lng,visited:false,createdAt:new Date().toISOString()};
    const next=[item,...items];setItems(next);saveRestaurants(next);setName('');setNote('');setError('');
  }
  return <Shell title="맛집 지도" description="지도에서 위치를 고르고, 내 맛집으로 저장해요.">
    {key?<><Script src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`} strategy="afterInteractive" onLoad={()=>setReady(true)}/><div id="restaurant-map" className="h-80 rounded-2xl bg-slate-100" role="region" aria-label="맛집 지도"/><p className="mt-2 text-xs text-slate-500">지도를 터치하면 저장할 위치 좌표가 바뀌어요.</p></>:<div className="rounded-2xl border border-dashed bg-slate-50 p-6 text-center"><p className="font-bold">🗺️ 지도 API 키 설정 전</p><p className="mt-2 text-sm text-slate-500">.env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 추가하면 지도가 표시돼요. 지금도 좌표를 입력해 장소 저장은 가능해.</p></div>}
    <div className="mt-5 space-y-3 rounded-2xl border p-4"><h2 className="font-bold">📍 맛집 추가</h2><label className="block text-sm">식당 이름<input aria-label="식당 이름" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border p-3" placeholder="예: 동네 단골 국밥집"/></label><label className="block text-sm">음식 종류<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full rounded-lg border p-3">{['한식','중식','일식','양식','분식','카페','기타'].map(x=><option key={x}>{x}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><label className="text-sm">위도<input type="number" step="any" value={lat} onChange={e=>setLat(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm">경도<input type="number" step="any" value={lng} onChange={e=>setLng(Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2"/></label></div><label className="block text-sm">메모<input value={note} onChange={e=>setNote(e.target.value)} className="mt-1 w-full rounded-lg border p-3" placeholder="먹어보고 싶은 메뉴"/></label>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<button onClick={add} className="w-full rounded-xl bg-orange-600 p-3 font-bold text-white">맛집 저장</button></div><p className="mt-4 text-sm text-slate-500">저장한 맛집 {items.length}곳 · 현재 기기에만 저장돼요.</p>
  </Shell>;
}
