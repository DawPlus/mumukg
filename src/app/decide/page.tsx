'use client';
import { useState } from 'react';
import { Shell } from '@/components/shell';
const defaults=['김치찌개','돈까스','초밥','제육볶음','파스타','햄버거','쌀국수','마라탕'];
type Mode='random'|'tournament'|'swipe';
export default function Decide(){
 const [mode,setMode]=useState<Mode>('random');
 const [choice,setChoice]=useState('');
 const [candidates,setCandidates]=useState<string[]>(defaults);
 const [round,setRound]=useState<string[]>(defaults);
 const [winners,setWinners]=useState<string[]>([]);
 const [index,setIndex]=useState(0);
 const [swipeIndex,setSwipeIndex]=useState(0);
 const [liked,setLiked]=useState<string[]>([]);
 const [draft,setDraft]=useState('');
 function reset(next:Mode){setMode(next);setChoice('');setRound([...candidates]);setWinners([]);setIndex(0);setSwipeIndex(0);setLiked([]);}
 function vote(selected:string){const next=[...winners,selected];if(index+2>=round.length){if(next.length===1){setChoice(next[0]);setIndex(round.length);}else{setRound(next);setIndex(0);setWinners([]);}}else{setWinners(next);setIndex(index+2);}}
 function add(e:React.FormEvent){e.preventDefault();const v=draft.trim();if(v&&!candidates.includes(v)){setCandidates([...candidates,v]);setDraft('');setMode('random');setChoice('');}}
 const modes:[Mode,string][]=[['random','🎲 랜덤'],['tournament','🏆 월드컵'],['swipe','💘 골라내기']];
 return <Shell>
 <div className="grid grid-cols-3 gap-2">{modes.map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>reset(id)} className={`min-h-12 rounded-xl border px-1 text-sm ${mode===id?'border-orange-600 bg-orange-50 font-bold':'border-slate-200'}`}>{label}</button>)}</div>
 <section className="mt-5 rounded-3xl bg-orange-50 p-5 text-center">
 {mode==='random'&&<><p className="text-sm text-slate-500">랜덤 메뉴 추천</p><h2 aria-live="polite" className="my-8 text-2xl font-extrabold">{choice||'오늘 뭘 먹을까?'}</h2><button onClick={()=>{const pool=candidates.filter(x=>x!==choice);const list=pool.length?pool:candidates;setChoice(list[Math.floor(Math.random()*list.length)]);}} className="min-h-12 w-full rounded-xl bg-orange-600 font-bold text-white">🎲 추천받기</button></>}
 {mode==='tournament'&&<>{choice?<><h2 className="my-6 text-2xl font-bold">🏆 우승: {choice}</h2><button onClick={()=>reset('tournament')} className="min-h-12 rounded-xl bg-orange-600 px-5 text-white">다시 하기</button></>:<><p className="text-sm text-slate-500">둘 중 하나를 골라줘 ({index+1} / {round.length})</p><div className="mt-4 grid grid-cols-2 gap-3">{round.slice(index,index+2).map(v=><button key={v} onClick={()=>vote(v)} className="min-h-32 break-words rounded-2xl border bg-white p-3 text-lg font-bold">{v}</button>)}</div></>}</>}
 {mode==='swipe'&&<>{swipeIndex<candidates.length?<><p className="text-sm text-slate-500">{swipeIndex+1} / {candidates.length}</p><h2 className="my-8 text-2xl font-bold">{candidates[swipeIndex]}</h2><div className="grid grid-cols-2 gap-3"><button onClick={()=>setSwipeIndex(x=>x+1)} className="min-h-12 rounded-xl bg-white font-bold">❌ 패스</button><button onClick={()=>{setLiked([...liked,candidates[swipeIndex]]);setSwipeIndex(x=>x+1);}} className="min-h-12 rounded-xl bg-orange-600 font-bold text-white">❤️ 좋아</button></div></>:<><h2 className="text-xl font-bold">선택한 메뉴</h2><p className="my-5 break-words">{liked.join(' · ')||'선택한 메뉴가 없어'}</p><button className="min-h-12 rounded-xl bg-orange-600 px-5 font-bold text-white" onClick={()=>reset('swipe')}>다시 고르기</button></>}</>}
 </section>
 <form onSubmit={add} className="mt-6 flex gap-2"><input value={draft} maxLength={30} onChange={e=>setDraft(e.target.value)} aria-label="후보 메뉴 추가" placeholder="후보 메뉴 추가" className="min-h-12 min-w-0 flex-1 rounded-xl border px-3 text-base"/><button className="min-h-12 rounded-xl bg-slate-900 px-4 font-bold text-white">추가</button></form>
 <div className="mt-3 flex flex-wrap gap-2">{candidates.map(m=><span key={m} className="inline-flex items-center rounded-full bg-slate-100 py-1 pl-3 text-sm">{m}<button aria-label={`${m} 제외`} onClick={()=>{if(candidates.length<=2)return;const next=candidates.filter(x=>x!==m);setCandidates(next);setRound(next);setIndex(0);setWinners([]);setSwipeIndex(0);setLiked([]);setChoice('');}} className="min-h-9 px-3 text-slate-500">×</button></span>)}</div>
 <p className="mt-3 text-xs text-slate-500">후보 메뉴는 현재 화면에서만 유지돼. 월드컵은 모든 후보가 짝수일 때 진행할 수 있어.</p>
 </Shell>;
}
