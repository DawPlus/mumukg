'use client';
import { useEffect, useState } from 'react';
import { Shell } from '@/components/shell';
type Menu={name:string;emoji:string;category:string};
const defaults:Menu[]=[{name:'치킨',emoji:'🍗',category:'치킨'},{name:'피자',emoji:'🍕',category:'피자'},{name:'짜장면',emoji:'🍜',category:'중식'},{name:'마라탕',emoji:'🌶️',category:'중식'},{name:'떡볶이',emoji:'🍢',category:'분식'},{name:'초밥',emoji:'🍣',category:'일식'},{name:'햄버거',emoji:'🍔',category:'패스트푸드'},{name:'족발·보쌈',emoji:'🥩',category:'한식'}];
const storage='mumukg.delivery.v1';
type Saved={extra:Menu[];favorites:string[];history:string[]};
const empty:Saved={extra:[],favorites:[],history:[]};
export default function DeliveryPage(){
 const [data,setData]=useState<Saved>(empty);
 const [loaded,setLoaded]=useState(false);
 const [category,setCategory]=useState('전체');
 const [favoriteOnly,setFavoriteOnly]=useState(false);
 const [choice,setChoice]=useState<string|null>(null);
 const [name,setName]=useState('');
 const [kind,setKind]=useState('기타');
 const [error,setError]=useState('');
 useEffect(()=>{const id=requestAnimationFrame(()=>{try {const raw=localStorage.getItem(storage);if(raw){const value:unknown=JSON.parse(raw);if(value&&typeof value==='object'){const x=value as Partial<Saved>;setData({extra:Array.isArray(x.extra)?x.extra.filter(m=>m&&typeof m.name==='string'&&typeof m.category==='string'&&typeof m.emoji==='string'):[],favorites:Array.isArray(x.favorites)?x.favorites.filter(v=>typeof v==='string'):[],history:Array.isArray(x.history)?x.history.filter(v=>typeof v==='string'):[]});}}}catch{}setLoaded(true);});return()=>cancelAnimationFrame(id);},[]);
 function update(next:Saved){try{localStorage.setItem(storage,JSON.stringify(next));setData(next);setError('');}catch{setError('저장하지 못했어요. 브라우저 저장 공간을 확인해 줘.');}}
 const menus=[...defaults,...data.extra]; const categories=['전체',...new Set(menus.map(m=>m.category))]; const filtered=menus.filter(m=>(category==='전체'||m.category===category)&&(!favoriteOnly||data.favorites.includes(m.name)));
 function choose(value:string){setChoice(value);update({...data,history:[value,...data.history].slice(0,12)});}
 function pick(){const pool=filtered.filter(m=>m.name!==choice);const candidates=pool.length?pool:filtered;if(candidates.length){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);choose(candidates[bytes[0]%candidates.length].name);}}
 function add(e:React.FormEvent){e.preventDefault();const value=name.trim();if(!value)return;if(menus.some(m=>m.name===value)){setError('이미 등록된 메뉴야.');return;}update({...data,extra:[...data.extra,{name:value,emoji:'🍽️',category:kind}]});setName('');setKind('기타');}
 function toggleFavorite(value:string){update({...data,favorites:data.favorites.includes(value)?data.favorites.filter(n=>n!==value):[...data.favorites,value]});}
 return <Shell>
 <section className="rounded-3xl bg-orange-50 p-5"><h2 className="text-xl font-bold">🛵 배달 메뉴 고르기</h2><div className="mt-4 flex gap-2 overflow-x-auto pb-2">{categories.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>{setCategory(c);setChoice(null);}} className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${category===c?'bg-orange-600 text-white':'border bg-white'}`}>{c}</button>)}</div>
 <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={favoriteOnly} onChange={e=>setFavoriteOnly(e.target.checked)}/> 즐겨찾기만 보기</label>
 <div className="rounded-2xl bg-white p-5 text-center"><p className="text-sm text-slate-500">오늘의 배달 추천</p><p aria-live="polite" className="my-5 text-2xl font-extrabold">{choice?`${menus.find(m=>m.name===choice)?.emoji??'🍽️'} ${choice}`:'뭐 시켜 먹지?'}</p><button disabled={!filtered.length} onClick={pick} className="min-h-12 w-full rounded-xl bg-orange-600 font-bold text-white disabled:opacity-40">🎲 메뉴 추천</button></div></section>
 <h2 className="mt-6 text-lg font-bold">메뉴 후보 ({filtered.length})</h2><div className="mt-3 grid grid-cols-2 gap-3">{filtered.map(m=><div key={m.name} className="rounded-2xl border p-3"><button className="min-h-14 w-full text-left" onClick={()=>choose(m.name)}><span className="text-2xl">{m.emoji}</span><span className="mt-1 block font-semibold">{m.name}</span><span className="text-xs text-slate-500">{m.category}</span></button><div className="mt-2 flex justify-between"><button aria-label={`${m.name} 즐겨찾기`} aria-pressed={data.favorites.includes(m.name)} onClick={()=>toggleFavorite(m.name)} className="min-h-11 px-2 text-xl">{data.favorites.includes(m.name)?'❤️':'🤍'}</button>{data.extra.some(x=>x.name===m.name)&&<button onClick={()=>{if(confirm(`${m.name} 메뉴를 삭제할까?`))update({...data,extra:data.extra.filter(x=>x.name!==m.name),favorites:data.favorites.filter(x=>x!==m.name)});}} className="min-h-11 px-2 text-sm text-red-600">삭제</button>}</div></div>)}</div>{!filtered.length&&<p className="mt-4 text-sm text-slate-500">조건에 맞는 메뉴가 없어.</p>}
 <form onSubmit={add} className="mt-6 space-y-3 rounded-2xl border p-4"><h2 className="font-bold">➕ 배달 메뉴 직접 추가</h2><input required maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 닭강정" aria-label="메뉴 이름" className="min-h-12 w-full rounded-xl border p-3 text-base"/><select value={kind} onChange={e=>setKind(e.target.value)} aria-label="음식 종류" className="min-h-12 w-full rounded-xl border p-3 text-base">{['기타',...categories.filter(x=>x!=='전체')].filter((v,i,a)=>a.indexOf(v)===i).map(c=><option key={c}>{c}</option>)}</select><button disabled={!loaded} className="min-h-12 w-full rounded-xl bg-slate-900 font-bold text-white">추가하기</button>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}</form>
 <section className="mt-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">최근 선택</h2>{data.history.length>0&&<button onClick={()=>update({...data,history:[]})} className="min-h-11 text-sm text-slate-500">기록 비우기</button>}</div>{data.history.length?<div className="mt-2 flex flex-wrap gap-2">{data.history.slice(0,8).map((v,i)=><span key={i} className="rounded-full bg-slate-100 px-3 py-2 text-sm">{v}</span>)}</div>:<p className="mt-2 text-sm text-slate-500">아직 선택 기록이 없어.</p>}</section>
 </Shell>;
}
