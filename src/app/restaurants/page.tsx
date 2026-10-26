'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shell } from '@/components/shell';
import { loadRestaurants, saveRestaurants } from '@/lib/restaurants';
import type { Restaurant } from '@/lib/types';

const categories = ['한식','중식','일식','양식','분식','카페','기타'];
const initialForm = {name:'',category:'한식',note:'',latitude:'',longitude:''};
export default function RestaurantList() {
  const [items,setItems] = useState<Restaurant[]>([]);
  const [editing,setEditing] = useState<string | null>(null);
  const [form,setForm] = useState(initialForm);
  const [open,setOpen] = useState(false);
  const [error,setError] = useState('');
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('전체');
  useEffect(()=>{const frame=requestAnimationFrame(()=>setItems(loadRestaurants()));return ()=>cancelAnimationFrame(frame);},[]);
  function persist(next:Restaurant[]) { try {saveRestaurants(next);setItems(next);return true;} catch {setError('저장 공간을 사용할 수 없어요. 브라우저 설정을 확인해 줘.');return false;} }
  function startEdit(item:Restaurant){setForm({name:item.name,category:item.category,note:item.note,latitude:String(item.latitude),longitude:String(item.longitude)});setEditing(item.id);setOpen(true);setError('');}
  function startAdd(){setForm(initialForm);setEditing(null);setOpen(true);setError('');}
  function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const name=form.name.trim(); const latitude=Number(form.latitude); const longitude=Number(form.longitude);
    if(!name){setError('식당 이름을 입력해 줘.');return;}
    if(!form.latitude.trim()||!form.longitude.trim()||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){setError('올바른 위도와 경도를 입력해 줘.');return;}
    const next=editing?items.map(item=>item.id===editing?{...item,name,category:form.category,note:form.note.trim(),latitude,longitude}:item):[{id:crypto.randomUUID(),name,category:form.category,note:form.note.trim(),latitude,longitude,visited:false,createdAt:new Date().toISOString()},...items];
    if(persist(next)){setOpen(false);setEditing(null);setError('');}
  }
  function remove(item:Restaurant){if(window.confirm(`'${item.name}'을(를) 목록에서 삭제할까?`))persist(items.filter(x=>x.id!==item.id));}
  const visible=items.filter(item=>(filter==='전체'||(filter==='방문 완료'?item.visited:!item.visited))&&[item.name,item.category,item.note].some(v=>v.toLowerCase().includes(query.trim().toLowerCase())));
  function toggleVisited(item:Restaurant){persist(items.map(x=>x.id===item.id?{...x,visited:!x.visited}:x));}
  return <Shell>
    <div className="mb-5 flex gap-2">
      <button onClick={startAdd} className="min-h-12 flex-1 rounded-xl bg-orange-600 px-4 font-bold text-white">+ 맛집 직접 등록</button>
      <Link href="/map" className="flex min-h-12 items-center justify-center rounded-xl border border-orange-300 px-4 font-semibold text-orange-700">지도 등록</Link>
    </div>
    {open && <form onSubmit={submit} className="mb-5 space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold">{editing?'맛집 수정':'새 맛집 등록'}</h2><button type="button" onClick={()=>setOpen(false)} className="min-h-11 px-3 text-sm text-slate-600">닫기</button></div>
      <label className="block text-sm font-medium">식당 이름<input required maxLength={70} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base" placeholder="식당 이름"/></label>
      <label className="block text-sm font-medium">분류<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base">{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="block text-sm font-medium">메모<textarea rows={2} maxLength={300} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-base" placeholder="대표 메뉴, 방문 메모"/></label>
      <p className="text-xs text-slate-600">현재는 지도 위치를 좌표로 저장해요. 지도 검색 기능은 추후 연결할 예정이야.</p>
      <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">위도<input inputMode="decimal" type="number" required step="any" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-base" placeholder="37.5495"/></label><label className="block text-sm font-medium">경도<input inputMode="decimal" type="number" required step="any" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-base" placeholder="126.914"/></label></div>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="min-h-12 w-full rounded-xl bg-orange-600 px-4 font-bold text-white">{editing?'변경 저장':'맛집 등록'}</button>
    </form>}
    <div className="mb-4 space-y-3"><input aria-label="맛집 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="식당 이름이나 메모 검색" className="min-h-12 w-full rounded-xl border border-slate-300 p-3 text-base"/><div className="flex gap-2">{['전체','방문 완료','미방문'].map(v=><button key={v} onClick={()=>setFilter(v)} aria-pressed={filter===v} className={`min-h-11 flex-1 rounded-xl border text-sm ${filter===v?'border-orange-600 bg-orange-50 font-semibold':'border-slate-200'}`}>{v}</button>)}</div></div>
    {visible.length?<div className="space-y-3">{visible.map(item=><article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="break-words text-base font-bold">📍 {item.name}</h2><p className="mt-1 break-words text-sm text-slate-500">{item.category} · {item.note||'메모 없음'}</p></div><span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">{item.category}</span></div><div className="mt-3 flex gap-2"><button onClick={()=>toggleVisited(item)} aria-pressed={item.visited} className={`min-h-11 rounded-xl px-3 text-sm ${item.visited?'bg-green-100 text-green-800':'bg-slate-100 text-slate-700'}`}>{item.visited?'✓ 방문함':'미방문'}</button><button className="min-h-11 flex-1 rounded-xl bg-slate-100 font-semibold text-slate-700" onClick={()=>startEdit(item)}>수정</button><button className="min-h-11 flex-1 rounded-xl border border-red-200 font-semibold text-red-700" onClick={()=>remove(item)}>삭제</button></div></article>)}</div>:<div className="rounded-2xl bg-slate-50 p-6 text-center"><p className="text-slate-500">{items.length?'검색 조건에 맞는 식당이 없어.':'아직 등록된 식당이 없어.'}</p><button className="mt-3 min-h-11 font-semibold text-orange-600" onClick={startAdd}>첫 맛집 등록하기</button></div>}
  </Shell>;
}
