'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Trash2, ShoppingBasket, Refrigerator, ChefHat, Minus, Snowflake, Package, Check, X, Bell, ScanBarcode, Camera, Share2 } from 'lucide-react';
import { Shell } from '@/components/shell';

type Item = { id:string; name:string; quantity:number; unit?:string; place?:string; expires:string; createdAt:string };
type Grocery = { id:string; name:string; checked:boolean };
type FridgeData = { items:Item[]; shopping:Grocery[] };
const KEY = 'mumukg.fridge.v1';
const initial:FridgeData = { items:[], shopping:[] };
const recipes = [
  {name:'김치볶음밥',icon:'🍳',needs:['김치','밥'],extras:['계란','대파']},
  {name:'계란볶음밥',icon:'🍚',needs:['계란','밥'],extras:['대파','간장']},
  {name:'참치김치찌개',icon:'🍲',needs:['참치','김치'],extras:['두부','대파']},
  {name:'계란말이',icon:'🥚',needs:['계란'],extras:['대파','당근']},
  {name:'치즈토스트',icon:'🥪',needs:['식빵','치즈'],extras:['계란']},
  {name:'감자볶음',icon:'🥔',needs:['감자'],extras:['양파']},
  {name:'두부부침',icon:'🍽️',needs:['두부'],extras:['간장','대파']},
  {name:'토마토 파스타',icon:'🍝',needs:['파스타면','토마토'],extras:['마늘','치즈']},
  {name:'오므라이스',icon:'🍛',needs:['계란','밥'],extras:['양파','당근']},
  {name:'떡볶이',icon:'🍢',needs:['떡','고추장'],extras:['양배추','대파','어묵','설탕']},
  {name:'양배추 떡볶이',icon:'🥬',needs:['양배추','떡','고추장'],extras:['대파','설탕']},
  {name:'양배추전',icon:'🥞',needs:['양배추','계란','밀가루'],extras:['소금']},
  {name:'떡국',icon:'🍲',needs:['떡','계란'],extras:['대파','국간장']},
  {name:'양배추 볶음',icon:'🥬',needs:['양배추'],extras:['간장','마늘']},
  {name:'김치전',icon:'🥞',needs:['김치','밀가루'],extras:['계란','대파']},
  {name:'참치마요 덮밥',icon:'🍚',needs:['참치','밥','마요네즈'],extras:['계란','김']},
  {name:'감자계란국',icon:'🥔',needs:['감자','계란'],extras:['대파','소금']},
];
const colors = { ink:'#4D5B3C', sage:'#D9D8B8' };
function daysUntil(value:string) { if (!value) return null; const parts=value.split('-').map(Number); const expiry=new Date(parts[0],parts[1]-1,parts[2]); const now=new Date(); now.setHours(0,0,0,0); return Math.round((expiry.getTime()-now.getTime())/86400000); }
function guessIcon(name:string) { if (/계란|달걀/.test(name))return '🥚';if(/김치/.test(name))return '🥬';if(/우유/.test(name))return '🥛';if(/고기|삼겹|소고기|돼지/.test(name))return '🥩';if(/치즈/.test(name))return '🧀';if(/감자/.test(name))return '🥔';if(/토마토/.test(name))return '🍅';if(/빵/.test(name))return '🍞';if(/생선|참치/.test(name))return '🐟';if(/밥|쌀/.test(name))return '🍚';return '🥗';}
const card='rounded-2xl border border-[#D9D8B8] bg-[#FBF8F0] p-4';
const primary='min-h-11 rounded-xl bg-[#4D5B3C] px-4 font-bold text-[#FFFCF2] disabled:opacity-40';

export default function FridgePage(){
  const [data,setData]=useState<FridgeData>(initial);
  const [ready,setReady]=useState(false);
  const [tab,setTab]=useState<'inventory'|'shopping'|'recipes'>('inventory');
  const [adding,setAdding]=useState(false);
  const [name,setName]=useState('');
  const [quantity,setQuantity]=useState('1');
  const [expires,setExpires]=useState('');
  const [grocery,setGrocery]=useState('');
  const [error,setError]=useState('');
  const [bridgeStatus,setBridgeStatus]=useState('');
  const [nativeAvailable,setNativeAvailable]=useState(false);
  const [photo,setPhoto]=useState<string|null>(null);
  useEffect(()=>{const id=requestAnimationFrame(()=>setNativeAvailable(Boolean(window.MumukgNative?.isNative)));return()=>cancelAnimationFrame(id);},[]);
  function haptic(type:'selection'|'success'|'error'='selection'){void window.MumukgNative?.triggerHaptic(type).catch(()=>undefined);}
  async function scanProduct(){
    const native=window.MumukgNative;if(!native?.isNative)return;
    try{const result=await native.scanBarcode();if(!result)return;setName(result.value);setAdding(true);setTab('inventory');setBridgeStatus('바코드 번호를 입력했어. 상품명으로 수정해 줘.');haptic('success');}
    catch{setBridgeStatus('스캔 실패. 카메라 권한을 확인해 줘.');haptic('error');}
  }
  async function takePhoto(){
    const native=window.MumukgNative;if(!native?.isNative)return;
    try{const result=await native.pickImage({source:'camera'});if(!result)return;setPhoto(result.uri);setBridgeStatus('사진을 가져왔어. 재료명은 직접 입력해 줘.');haptic('success');}
    catch{setBridgeStatus('사진을 불러오지 못했어.');haptic('error');}
  }
  async function shareFridge(){
    const message='우리 집 냉털 🥬\n'+data.items.map(item=>item.name+' '+item.quantity+(item.unit??'개')).join('\n');
    try{if(window.MumukgNative?.isNative)await window.MumukgNative.share({title:'냉털',message});
      else if(navigator.share)await navigator.share({title:'냉털',text:message});
      else{await navigator.clipboard.writeText(message);setBridgeStatus('재고 목록 복사 완료');}
    }catch{setBridgeStatus('공유를 완료하지 못했어.');}
  }
  async function scheduleExpiryAlerts(){
    const native=window.MumukgNative;if(!native?.isNative)return;
    try{
      const permission=await native.requestNotificationPermission();
      if(permission.status!=='granted'){setBridgeStatus('알림 권한이 필요해.');return;}
      let count=0;
      for(const item of data.items){
        const id='fridge-expiry-'+item.id;
        await native.cancelNotification(id);
        if(!item.expires)continue;
        const [y,m,d]=item.expires.split('-').map(Number);
        const date=new Date(y,m-1,d-1,9);
        if(date.getTime()<=Date.now())continue;
        await native.scheduleNotification({id,title:'냉털 소비기한',body:item.name+' 소비기한이 내일이야.',triggerAt:date.toISOString(),data:{route:'/delivery',itemId:item.id}});
        count++;
      }
      setBridgeStatus(count+'개 알림 예약 완료');haptic('success');
    }catch{setBridgeStatus('알림 예약에 실패했어.');haptic('error');}
  }
  const reduced=useReducedMotion();
  useEffect(()=>{const id=requestAnimationFrame(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw) as Partial<FridgeData>;if(Array.isArray(parsed.items)&&Array.isArray(parsed.shopping))setData({items:parsed.items.filter(x=>x&&typeof x.name==='string'&&typeof x.id==='string'),shopping:parsed.shopping.filter(x=>x&&typeof x.name==='string'&&typeof x.id==='string')});}}catch{}setReady(true);});return()=>cancelAnimationFrame(id);},[]);
  function update(next:FridgeData){
    const removed=data.items.filter(item=>!next.items.some(row=>row.id===item.id));
    if(window.MumukgNative?.isNative)for(const item of removed)void window.MumukgNative.cancelNotification('fridge-expiry-'+item.id).catch(()=>undefined);
    setData(next);try{localStorage.setItem(KEY,JSON.stringify(next));setError('');haptic('selection');}catch{setError('저장 실패. 저장 공간을 확인해 줘.');}
  }
  function addItem(e:React.FormEvent){e.preventDefault();const n=name.trim();const q=Number(quantity);if(!n||!Number.isInteger(q)||q<=0){setError('재료와 수량을 확인해 줘.');return;}update({...data,items:[{id:crypto.randomUUID(),name:n,quantity:q,unit:'개',expires,createdAt:new Date().toISOString()},...data.items]});setName('');setQuantity('1');setExpires('');setAdding(false);}
  function changeQuantity(id:string,change:number){update({...data,items:data.items.map(x=>x.id===id?{...x,quantity:Math.max(0,Math.round((x.quantity+change)*100)/100)}:x).filter(x=>x.quantity>0)});}
  function addShopping(e:React.FormEvent){e.preventDefault();const n=grocery.trim();if(!n)return;update({...data,shopping:[...data.shopping,{id:crypto.randomUUID(),name:n,checked:false}]});setGrocery('');}
  const stats=useMemo(()=>({count:data.items.length,soon:data.items.filter(x=>{const d=daysUntil(x.expires);return d!==null&&d>=0&&d<=3;}).length,expired:data.items.filter(x=>{const d=daysUntil(x.expires);return d!==null&&d<0;}).length}),[data.items]);
  const sorted=useMemo(()=>[...data.items].sort((a,b)=>{const da=daysUntil(a.expires),db=daysUntil(b.expires);return (da??Infinity)-(db??Infinity)}),[data.items]);
  const matching=useMemo(()=>recipes.map(r=>{const owns=(ingredient:string)=>data.items.some(item=>item.quantity>0&&(daysUntil(item.expires)===null||daysUntil(item.expires)!>=0)&&(item.name.trim()===ingredient||item.name.includes(ingredient)));return {...r,have:r.needs.filter(owns),missing:r.needs.filter(x=>!owns(x)),optional:r.extras.filter(x=>!owns(x))};}).sort((a,b)=>a.missing.length-b.missing.length||b.have.length-a.have.length),[data.items]);
  function addMissing(names:string[]){const existing=new Set(data.shopping.map(x=>x.name));const additions=names.filter(x=>!existing.has(x)).map(x=>({id:crypto.randomUUID(),name:x,checked:false}));if(additions.length){update({...data,shopping:[...data.shopping,...additions]});setTab('shopping');}}
  return <Shell tone="editorial"><div className="mx-auto max-w-3xl space-y-4 pb-8 text-[#4D5B3C]">
    <motion.div initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} className="relative overflow-hidden rounded-3xl bg-[#D9D8B8] p-5 sm:p-7">
      <div className="relative z-10"><p className="text-xs font-bold tracking-[0.2em] opacity-70">MY LITTLE FRIDGE</p><h2 className="mt-2 text-3xl font-black">냉털 🥬</h2><p className="mt-2 text-sm opacity-75">남은 재료를 알뜰하게, 오늘의 한 끼는 맛있게.</p></div>
      <motion.div aria-hidden="true" animate={reduced?{}:{rotate:[-5,5,-5]}} transition={{duration:5,repeat:Infinity,ease:'easeInOut'}} className="absolute -right-3 -bottom-4 opacity-25"><Refrigerator size={135} strokeWidth={1}/></motion.div>
    </motion.div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>void shareFridge()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#B9B99E] bg-[#FBF8F0] px-4 text-xs font-bold"><Share2 size={15}/>재고 공유</button>
      {nativeAvailable&&<>
        <button type="button" onClick={()=>void scheduleExpiryAlerts()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#B9B99E] bg-[#FBF8F0] px-4 text-xs font-bold"><Bell size={15}/>소비기한 알림</button>
        <button type="button" onClick={()=>void scanProduct()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#B9B99E] bg-[#FBF8F0] px-4 text-xs font-bold"><ScanBarcode size={15}/>바코드</button>
        <button type="button" onClick={()=>void takePhoto()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#B9B99E] bg-[#FBF8F0] px-4 text-xs font-bold"><Camera size={15}/>사진 촬영</button>
      </>}
    </div>
    {bridgeStatus&&<p role="status" className="rounded-xl bg-[#E6E8D9] px-3 py-2 text-xs">{bridgeStatus}</p>}
    {photo&&<div className="rounded-xl bg-[#FBF8F0] p-3"><p className="mb-2 text-xs">재료 참고 사진</p><img src={photo} alt="선택한 재료 사진" className="max-h-44 max-w-full rounded-lg object-contain"/><button type="button" onClick={()=>{if(photo.startsWith('blob:'))URL.revokeObjectURL(photo);setPhoto(null);}} className="mt-2 text-xs underline">사진 닫기</button></div>}
    <div className="grid grid-cols-3 gap-2">
      {([{label:'보관 재료',value:stats.count,color:colors.ink},{label:'기한 임박',value:stats.soon,color:'#B07A3D'},{label:'기한 경과',value:stats.expired,color:'#A64F48'}]).map((stat,i)=><motion.div key={stat.label} initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} className="rounded-2xl border border-[#D9D8B8] bg-[#FBF8F0] p-3 text-center"><p className="text-2xl font-black" style={{color:stat.color}}>{stat.value}</p><p className="mt-1 text-xs opacity-70">{stat.label}</p></motion.div>)}
    </div>
    <div className="grid grid-cols-3 gap-2">
      {([{id:'inventory',label:'내 냉장고',icon:Refrigerator},{id:'recipes',label:'냉털 요리',icon:ChefHat},{id:'shopping',label:'장보기',icon:ShoppingBasket}] as const).map(t=><button key={t.id} type="button" aria-pressed={tab===t.id} onClick={()=>setTab(t.id)} className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:text-sm ${tab===t.id?'bg-[#4D5B3C] text-white':'border border-[#D9D8B8] bg-[#FBF8F0]'}`}><t.icon size={16}/>{t.label}</button>)}
    </div>
    {tab==='inventory'&&<section className={card}>
      <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">재료 목록 <span className="text-sm font-medium opacity-60">{sorted.length}</span></h3><button type="button" className={primary} onClick={()=>setAdding(x=>!x)}><Plus size={16} className="mr-1 inline"/>{adding?'닫기':'재료 추가'}</button></div>
      {adding&&<form onSubmit={addItem} className="mt-4 space-y-3 rounded-xl bg-[#EFE6D4] p-3"><label className="block text-xs font-bold">재료명<input required maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 계란" className="mt-1 min-h-11 w-full rounded-lg bg-white px-3 text-base"/></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold">수량<input type="number" min="1" step="1" required value={quantity} onChange={e=>setQuantity(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg bg-white px-3 text-base"/></label><label className="text-xs font-bold">소비기한 (선택)<input type="date" value={expires} onChange={e=>setExpires(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg bg-white px-2 text-sm"/></label></div><button type="submit" disabled={!ready} className={primary+' w-full'}>냉장고에 넣기</button></form>}
      <div className="mt-3 space-y-2">{sorted.map(item=>{const d=daysUntil(item.expires);return <motion.div layout key={item.id} initial={reduced?false:{opacity:0,x:-12}} animate={{opacity:1,x:0}} className="flex items-center gap-3 rounded-xl border border-[#E8E2D4] bg-white p-3"><span className="text-2xl" aria-hidden="true">{guessIcon(item.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="text-xs opacity-60">{d===null?'기한 미설정':d<0?`${Math.abs(d)}일 경과`:d===0?'오늘까지':`D-${d}`}</p></div><div className="flex items-center gap-1"><button type="button" aria-label={item.name+' 수량 줄이기'} onClick={()=>changeQuantity(item.id,-1)} className="flex size-9 items-center justify-center rounded-lg bg-[#F1EDE3]"><Minus size={15}/></button><span className="min-w-9 text-center text-xs font-bold">{item.quantity}{item.unit??'개'}</span><button type="button" aria-label={item.name+' 수량 늘리기'} onClick={()=>changeQuantity(item.id,1)} className="flex size-9 items-center justify-center rounded-lg bg-[#F1EDE3]"><Plus size={15}/></button><button type="button" aria-label={item.name+' 삭제'} onClick={()=>update({...data,items:data.items.filter(x=>x.id!==item.id)})} className="ml-1 flex size-9 items-center justify-center text-[#A64F48]"><Trash2 size={16}/></button></div></motion.div>})}</div>
      {!sorted.length&&<div className="py-10 text-center"><Snowflake className="mx-auto mb-3 opacity-40" size={35}/><p className="text-sm opacity-65">아직 재료가 없어. 냉장고를 채워볼까?</p></div>}
    </section>}
    {tab==='recipes'&&<section className={card}><h3 className="text-lg font-bold">냉털 요리 🍳</h3><p className="mt-1 text-xs opacity-65">미리 준비한 메뉴에서 재료를 비교해. 양념도 필요한 재료로 확인해 줘.</p><div className="mt-4 space-y-2">{matching.filter(r=>r.have.length>0).map(r=><div key={r.name} className="flex items-start gap-3 rounded-xl bg-white p-3"><span className="text-3xl">{r.icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{r.name}</p><p className="mt-1 text-xs text-[#73825C]">있는 재료: {r.have.join(', ')}</p><p className="mt-1 text-xs opacity-75">{r.missing.length===0?'필수 재료 준비 완료':`필수 재료 부족: ${r.missing.join(', ')}`}</p>{r.optional.length>0&&<p className="mt-1 text-xs opacity-60">있으면 좋은 재료: {r.optional.join(', ')}</p>}{r.missing.length>0&&<button type="button" onClick={()=>addMissing(r.missing)} className="mt-2 rounded-lg bg-[#D9D8B8] px-3 py-2 text-xs font-semibold">부족한 재료 장보기 추가</button>}</div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${!r.missing.length?'bg-[#D9D8B8]':'bg-[#EFE6D4]'}`}>{r.have.length}/{r.needs.length}</span></div>)}{!matching.some(r=>r.have.length>0)&&<p className="py-8 text-center text-sm opacity-65">재료를 추가하면 어울리는 메뉴가 나타나!</p>}</div></section>}
    {tab==='shopping'&&<section className={card}><h3 className="text-lg font-bold">장보기 목록 🛒</h3><form onSubmit={addShopping} className="mt-3 flex gap-2"><input value={grocery} onChange={e=>setGrocery(e.target.value)} maxLength={40} aria-label="장볼 재료" placeholder="무엇을 사야 할까?" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#D9D8B8] bg-white px-3 text-base"/><button className={primary} disabled={!grocery.trim()}><Plus size={18}/></button></form><div className="mt-3 space-y-2">{data.shopping.map(item=><div key={item.id} className="flex items-center gap-2 rounded-xl bg-white p-2"><button aria-label={item.name+' 체크'} aria-pressed={item.checked} onClick={()=>update({...data,shopping:data.shopping.map(x=>x.id===item.id?{...x,checked:!x.checked}:x)})} className="flex size-10 items-center justify-center">{item.checked?<Check size={20}/>:<span className="size-5 rounded border border-[#A6AA8F]"/>}</button><span className={`min-w-0 flex-1 text-sm font-medium ${item.checked?'line-through opacity-50':''}`}>{item.name}</span><button type="button" title="구매 후 재고 등록" aria-label={item.name+' 냉장고로 옮기기'} onClick={()=>{setName(item.name);setAdding(true);setTab('inventory');update({...data,shopping:data.shopping.filter(x=>x.id!==item.id)});}} className="flex size-10 items-center justify-center"><Package size={18}/></button><button aria-label={item.name+' 삭제'} onClick={()=>update({...data,shopping:data.shopping.filter(x=>x.id!==item.id)})} className="flex size-10 items-center justify-center"><X size={17}/></button></div>)}{!data.shopping.length&&<p className="py-8 text-center text-sm opacity-65">장볼 재료를 추가해 봐.</p>}</div></section>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <p className="px-1 text-center text-xs opacity-55">초안 · 이 브라우저에 저장돼요. 다른 기기와의 동기화는 추후 지원 예정.</p>
  </div></Shell>;
}
