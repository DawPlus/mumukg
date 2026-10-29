'use client';

import { useEffect, useRef, useState } from 'react';
import { decideDb, type DecideFoodRow } from '@/lib/decide-db';
import { Shell } from '@/components/shell';
import { Plus, X } from 'lucide-react';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ElectricBorder from '@/components/ElectricBorder';
import { AnimatePresence, motion } from 'motion/react';

type Mood = 'all' | 'spicy' | 'soup' | 'hearty';
type Mode = 'kuji' | 'battle' | 'fortune';
type Food = { name: string; moods: Mood[] };
const STORAGE_KEY = 'mumukg-decide-foods-v1';
const INITIAL: Food[] = [
  { name: '김치찌개', moods: ['spicy', 'soup', 'hearty'] },
  { name: '돈까스', moods: ['hearty'] },
  { name: '초밥', moods: [] },
  { name: '제육볶음', moods: ['spicy', 'hearty'] },
  { name: '파스타', moods: [] },
  { name: '햄버거', moods: ['hearty'] },
  { name: '쌀국수', moods: ['soup'] },
  { name: '마라탕', moods: ['spicy', 'soup'] },
];
const MOODS: { id: Mood; label: string }[] = [
  { id: 'all', label: '🎲 아무거나' },
  { id: 'spicy', label: '🌶️ 매콤' },
  { id: 'soup', label: '🍜 국물' },
  { id: 'hearty', label: '🍖 든든' },
];
const MODES: { id: Mode; label: string; description: string }[] = [
  { id: 'kuji', label: '🎟️ 쿠지', description: '뜯어서 뽑기' },
  { id: 'battle', label: '🏆 빠른 배틀', description: '둘 중 하나씩' },
  { id: 'fortune', label: '🥠 음식 운세', description: '오늘의 한마디' },
];
const FORTUNES = [
  '오늘은 이 메뉴가 널 선택했어! ✨',
  '맛있는 운명이 정해졌습니다. 🍀',
  '더 고민하면 배만 고파져! 😋',
  '오늘의 행운은 한 입에서 시작돼. 🥢',
  '오늘은 이거 먹고 기분 좋은 하루! 🌿',
];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export default function Decide() {
  const [foods, setFoods] = useState<Food[]>(INITIAL);
  const [rows, setRows] = useState<DecideFoodRow[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [member, setMember] = useState(false);
  const [email, setEmail] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>('kuji');
  const [choice, setChoice] = useState('');
  const [fortune, setFortune] = useState('');
  const [draft, setDraft] = useState('');
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [battle, setBattle] = useState<string[]>([]);
  const [battleStep, setBattleStep] = useState(0);
  const [ticket, setTicket] = useState<number | null>(null);
  const [tear, setTear] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const tearStart = useRef(0);
  const lastVibration = useRef(0);
  const lastTearPosition = useRef(0);
  const vibrate = (duration: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(duration);
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((food) =>
          food && typeof food.name === 'string' && food.name.length <= 30 &&
          Array.isArray(food.moods) && food.moods.every((mood: unknown) => MOODS.some((m) => m.id === mood))
        )) queueMicrotask(() => setFoods(parsed as Food[]));
      }
    } catch { /* 저장 데이터가 손상되면 기본 후보 사용 */ }
    queueMicrotask(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded && !member) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
  }, [foods, loaded, member]);

  useEffect(() => {
    const db = decideDb;
    if (!db) return;
    const boot = async () => {
      const { data } = await db.auth.getUser();
      setAccount(data.user?.id ?? null);
    };
    void boot();
    const { data: listener } = db.auth.onAuthStateChange((_event, session) => {
      setAccount(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const db = decideDb;
    if (!db || !account) return;
    let disposed = false;
    const load = async () => {
      const { data: membership, error: membershipError } = await db.from('decide_members')
        .select('user_id').eq('user_id', account).maybeSingle();
      if (disposed) return;
      if (membershipError) { setSyncError(membershipError.message); return; }
      if (!membership) { setMember(false); return; }
      const { data, error } = await db.from('decide_foods')
        .select('id,name,moods,created_at').order('created_at', { ascending: true });
      if (disposed) return;
      if (error) { setSyncError(error.message); return; }
      setRows((data ?? []) as DecideFoodRow[]);
      setFoods((data ?? []).map(({ name, moods }) => ({ name, moods: moods as Mood[] })));
      setMember(true);
      setSyncError('');
    };
    void load();
    return () => { disposed = true; };
  }, [account]);

  const reloadFoods = async () => {
    if (!decideDb) return;
    const { data, error } = await decideDb.from('decide_foods')
      .select('id,name,moods,created_at').order('created_at', { ascending: true });
    if (error) { setSyncError(error.message); return; }
    setRows((data ?? []) as DecideFoodRow[]);
    setFoods((data ?? []).map(({ name, moods }) => ({ name, moods: moods as Mood[] })));
    setSyncError('');
  };
  const requestSignIn = async () => {
    if (!decideDb || !email.trim()) return;
    setSyncBusy(true);
    const { error } = await decideDb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/decide' }
    });
    setSyncBusy(false);
    setSyncError(error ? error.message : '로그인 링크를 이메일로 보냈어. 메일함을 확인해 줘.');
  };
  const importLocalFoods = async () => {
    if (!decideDb || !member) return;
    setSyncBusy(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) throw new Error('로컬 후보 데이터를 읽을 수 없어.');
      const names = new Set(rows.map((row) => row.name.toLocaleLowerCase()));
      const toImport = (parsed as Food[]).filter((food) =>
        typeof food.name === 'string' && food.name.trim().length <= 30 &&
        !names.has(food.name.trim().toLocaleLowerCase())
      ).map((food) => ({ name: food.name.trim(), moods: Array.isArray(food.moods) ? food.moods : [], created_by: account }));
      if (toImport.length) {
        const { error } = await decideDb.from('decide_foods').insert(toImport);
        if (error) throw error;
      }
      await reloadFoods();
      setSyncError(toImport.length ? `로컬 후보 ${toImport.length}개 가져왔어.` : '가져올 새로운 후보가 없어.');
    } catch (error) { setSyncError(error instanceof Error ? error.message : '가져오기 실패'); }
    setSyncBusy(false);
  };

  const pool = foods;
  const reset = () => { setChoice(''); setFortune(''); setBattle([]); setBattleStep(0); setTicket(null); setTear(0); setDragging(false); startX.current = null; };
  const changeMode = (next: Mode) => { setMode(next); reset(); };

  const draw = () => {
    if (!pool.length) return;
    const options = pool.filter((food) => food.name !== choice);
    setChoice(pick(options.length ? options : pool).name);
    setFortune(pick(FORTUNES));
  };
  const openTicket = (number: number) => {
    if (!pool.length) return;
    const options = pool.filter((food) => food.name !== choice);
    setChoice(pick(options.length ? options : pool).name);
    setTicket(number);
    setTear(0);
    setDragging(false);
    lastTearPosition.current = 0;
  };
  const tearTo = (value: number) => setTear(Math.max(0, Math.min(100, value)));
  const moveTear = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const width = event.currentTarget.parentElement?.getBoundingClientRect().width || 1;
    const next = Math.max(0, Math.min(100, tearStart.current + (event.clientX - startX.current) / width * 100));
    tearTo(next);
    const now = performance.now();
    if (Math.abs(next - lastTearPosition.current) >= 6 && now - lastVibration.current >= 85) {
      vibrate(9);
      lastVibration.current = now;
      lastTearPosition.current = next;
    }
  };
  const endTear = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if ('vibrate' in navigator) navigator.vibrate(0);
    // 끝까지 뜯지 못하고 손을 놓으면 절취선을 시작 지점으로 되돌린다.
    setTear((value) => value >= 78 ? 100 : 0);
    lastTearPosition.current = 0;
  };

  const startBattle = () => {
    if (pool.length < 2) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setBattle(shuffled.slice(0, Math.min(4, shuffled.length)).map((f) => f.name));
    setBattleStep(0);
    setChoice('');
  };
  const vote = (name: string) => {
    if (battle.length <= 2) { setChoice(name); setBattle([]); return; }
    if (battleStep === 0) { setBattle((items) => [items[2], items[3], name].filter(Boolean)); setBattleStep(1); }
    else { setBattle((items) => [items[2], name].filter(Boolean)); setBattleStep(2); }
  };
  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name || foods.some((food) => food.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    if (!member || !decideDb) { setSyncError('로그인 및 멤버 승인 후 수정할 수 있어.'); return; }
    setSyncBusy(true);
    const { error } = await decideDb.from('decide_foods').insert({ name, moods: [], created_by: account });
    if (error) setSyncError(error.message);
    else { await reloadFoods(); setDraft(''); reset(); }
    setSyncBusy(false);
  };
  const remove = async (name: string) => {
    if (!member || !decideDb) return;
    const row = rows.find((item) => item.name === name);
    if (!row) return;
    setSyncBusy(true);
    const { error } = await decideDb.from('decide_foods').delete().eq('id', row.id);
    if (error) setSyncError(error.message);
    else { await reloadFoods(); reset(); }
    setSyncBusy(false);
  };

  const primary = 'min-h-12 rounded-2xl bg-[#4D5B3C] px-5 font-bold text-[#EFE6D4] disabled:cursor-not-allowed disabled:opacity-40';

  return <Shell>
    <main className="min-w-0 space-y-5 pb-12 text-[#4D5B3C]">
      <header className="rounded-3xl bg-[#EFE6D4] p-5 sm:p-7">
        <p className="text-sm font-semibold opacity-70">고민 해결 연구소</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">오늘 뭐 먹지? 🍽️</h1>
        <p className="mt-2 text-sm opacity-75">메뉴는 등록해두고, 결정은 운명에 맡겨봐!</p>
      </header>

      <section className="rounded-2xl border border-[#D9D8B8] bg-white p-4 text-sm">
        <p className="font-bold">☁️ 공유 메뉴 후보 {member ? '연결됨' : '로그인 필요'}</p>
        {!decideDb ? <p>Supabase 환경변수 설정이 필요해.</p> :
          !account ? <form onSubmit={(event) => { event.preventDefault(); void requestSignIn(); }} className="mt-3 flex flex-wrap gap-2">
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일 주소" aria-label="로그인 이메일" className="min-h-10 min-w-0 flex-1 rounded-lg border px-3"/>
            <button disabled={syncBusy} className="rounded-lg bg-[#4D5B3C] px-4 text-white">로그인 링크 받기</button>
          </form> :
          <div className="mt-2 space-y-2">
            <p>{member ? '모두가 같은 후보를 사용해.' : '로그인됐어. 멤버 승인 후 공유 후보를 사용할 수 있어.'}</p>
            <div className="flex flex-wrap gap-2">
              {member && <><button type="button" onClick={() => void reloadFoods()} className="rounded-lg border px-3 py-2">새로고침</button>
                <button type="button" disabled={syncBusy} onClick={() => void importLocalFoods()} className="rounded-lg border px-3 py-2">기존 후보 가져오기</button></>}
              <button type="button" onClick={() => void decideDb?.auth.signOut()} className="rounded-lg border px-3 py-2">로그아웃</button>
            </div>
          </div>}
        {syncError && <p role="status" className="mt-2 break-words text-xs">{syncError}</p>}
      </section>
      <section aria-label="뽑기 방식" className="grid grid-cols-3 gap-2">
        {MODES.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id}
          onClick={() => changeMode(item.id)}
          className={`min-w-0 rounded-2xl border p-3 text-center transition-colors ${mode === item.id ? 'border-[#4D5B3C] bg-[#D9D8B8]' : 'border-[#D9D8B8] bg-white'}`}>
          <span className="block text-sm font-bold sm:text-base">{item.label}</span>
          <span className="mt-1 hidden text-xs opacity-70 sm:block">{item.description}</span>
        </button>)}
      </section>

      <section aria-label="메뉴 추천 결과" className="rounded-3xl bg-[#EFE6D4] p-5 text-center sm:p-8">
        <p className="text-sm opacity-70">{mode === 'battle' ? '취향 대결' : mode === 'fortune' ? '오늘의 음식 운세' : '종이 쿠지 뽑기'} · 후보 {pool.length}개</p>
        {mode === 'kuji' ? <div className="py-5">
          {ticket === null ? <>
            <p className="mb-5 text-sm">마음에 드는 쿠지를 한 장 골라봐!</p>
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 sm:gap-5">
              {Array.from({ length: 6 }, (_, index) => <button key={index} type="button" disabled={!pool.length}
                onClick={() => openTicket(index + 1)}
                className="aspect-[4/5] min-w-0 rounded-lg border-2 border-dashed border-[#4D5B3C]/50 bg-[#D9D8B8] p-2 shadow-sm transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-40">
                <span className="block text-[10px] tracking-widest sm:text-xs">LUCKY</span>
                <span className="my-2 block text-4xl font-black">?</span>
                <span className="block text-xs">NO. {String(index + 1).padStart(2, '0')}</span>
              </button>)}
            </div>
          </> : <div className="mx-auto max-w-md space-y-4">
            <p className="text-sm font-bold">NO. {String(ticket).padStart(2, '0')} · {tear === 100 ? '당첨!' : '절취선을 오른쪽으로 밀어 뜯어봐!'}</p>
            <ElectricBorder color="#A47536" glowColor="#D9D8B8" speed={1.5} chaos={0.8} glow={1.8} intensity={1.5} thickness={2} spread={1} arcs={2} active={tear < 100} intro={false} interactive={false} borderRadius={12} className="w-full">
            <motion.div className="relative h-52 overflow-hidden rounded-xl border-2 border-[#4D5B3C] bg-[#D9D8B8] shadow-md"
              animate={dragging && tear > 0 && tear < 100 ? {
                x: [-1, 1, -0.8, 0.8, 0].map((value) => value * (2 + tear * 0.045)),
                rotate: [-1, 1, -0.8, 0.8, 0].map((value) => value * (0.4 + tear * 0.009)),
              } : { x: 0, rotate: 0 }}
              transition={dragging && tear > 0 && tear < 100 ? { duration: Math.max(0.075, 0.14 - tear * 0.0006), repeat: Infinity, ease: "linear" } : { duration: 0.12 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-5" aria-live="polite">
                <span className="text-xs tracking-widest">TODAY MENU</span>
                <strong className="mt-3 break-keep text-3xl">{tear === 100 ? choice : '???'}</strong>
                {tear === 100 && <span className="mt-3 text-sm">🎉 맛있게 먹어!</span>}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EFE6D4] motion-safe:transition-opacity"
                style={{ clipPath: 'inset(0 0 0 ' + tear + '%)', opacity: tear === 100 ? 0 : 1 }} aria-hidden="true">
                <span className="text-3xl">🎟️</span><strong className="mt-2 text-xl">SECRET MENU</strong>
                <span className="mt-2 text-xs tracking-widest">TEAR TO REVEAL</span>
              </div>
              <AnimatePresence>
                {tear === 100 && <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => <motion.span key={i}
                    className="absolute h-0.5 w-12 -rotate-45 rounded-full bg-[#A47536] shadow-[0_0_9px_2px_#D9D8B8]"
                    style={{ left: `${(i * 29 + 7) % 100}%`, top: '-20%' }}
                    initial={{ y: -30, opacity: 0, scaleX: 0.5 }}
                    animate={{ y: 270, opacity: [0, 1, 0], scaleX: [0.5, 1.1, 0.7] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75 + (i % 4) * 0.18, delay: (i % 6) * 0.08, ease: 'easeOut' }} />)}
                </div>}
              </AnimatePresence>
              {tear < 100 && <div className="absolute inset-y-0 z-10 flex w-12 -translate-x-1/2 items-center justify-center border-x-2 border-dashed border-[#4D5B3C] bg-[#D9D8B8]/80"
                role="slider" aria-label="종이 절취선" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tear)} tabIndex={0}
                style={{ left: Math.max(8, Math.min(92, tear)) + '%', touchAction: 'none' }}
                onPointerDown={(event) => { startX.current = event.clientX; tearStart.current = tear; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerMove={moveTear} onPointerUp={endTear} onPointerCancel={endTear}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') { event.preventDefault(); tearTo(tear + 20); }
                  if (event.key === 'ArrowLeft') { event.preventDefault(); tearTo(tear - 20); }
                  if (['End', 'Enter', ' '].includes(event.key)) { event.preventDefault(); tearTo(100); }
                }}>
                <span className="rounded-full bg-[#4D5B3C] px-2 py-3 text-xs text-[#EFE6D4]">››</span>
              </div>}
            </motion.div>
            </ElectricBorder>
            {tear === 100 ? <button type="button" onClick={reset} className={primary}>🎟️ 다시 뽑기</button> :
              <button type="button" onClick={() => tearTo(100)} className="text-sm underline underline-offset-4">드래그가 어려우면 바로 열기</button>}
          </div>}
        </div> : mode === 'battle' && !choice && battle.length >= 2 ?
          <>
            <p className="mt-5 text-sm font-semibold">{battle.length === 2 ? '마지막 선택!' : '둘 중 더 끌리는 메뉴는?'}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {battle.slice(0, 2).map((name) => <button key={name} onClick={() => vote(name)}
                className="min-h-36 min-w-0 break-keep rounded-2xl border border-[#D9D8B8] bg-white p-3 text-lg font-black">{name}</button>)}
            </div>
          </> :
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-5" aria-live="polite">
            <span className="text-5xl" aria-hidden="true">{mode === 'fortune' ? '🥠' : '🏆'}</span>
            <h2 className="break-keep text-2xl font-black sm:text-3xl">{choice || (mode === 'battle' ? '오늘의 승자는?' : '오늘 뭘 먹을까?')}</h2>
            {choice && <p className="text-sm">{mode === 'fortune' ? fortune : '오늘은 이걸로 결정! ✨'}</p>}
          </div>}
        {pool.length === 0 && <p className="mb-4 text-sm text-[#B4534B]">이 조건에 맞는 메뉴가 없어. 필터를 바꾸거나 메뉴를 추가해줘.</p>}
        {(mode === 'fortune' || (mode === 'battle' && (Boolean(choice) || battle.length < 2))) &&
          <button type="button" disabled={pool.length < (mode === 'battle' ? 2 : 1)}
            onClick={mode === 'battle' ? startBattle : draw} className={primary + ' w-full'}>
            {mode === 'battle' ? (choice ? '🏆 다시 대결하기' : '🏆 배틀 시작하기') : choice ? '🥠 다시 뽑기' : '🥠 오늘의 운세 열기'}
          </button>}
        {mode === 'battle' && pool.length === 1 && <p className="mt-2 text-xs">배틀에는 후보가 최소 2개 필요해.</p>}
      </section>

      {!menuDrawerOpen && <button type="button" onClick={() => setMenuDrawerOpen(true)}
        aria-label="메뉴 후보 관리 열기" title="메뉴 후보 관리"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-12 items-center justify-center rounded-full border border-[#4D5B3C] bg-[#4D5B3C] text-[#EFE6D4] shadow-lg transition-transform active:scale-95">
        <Plus size={22} strokeWidth={2.25} aria-hidden="true" />
      </button>}
      <DepthDrawer open={menuDrawerOpen} depth={1} onClose={() => setMenuDrawerOpen(false)}>
        <DrawerHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[#D9D8B8] px-5 py-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] text-left">
          <div className="min-w-0">
            <DrawerTitle className="text-lg font-bold text-[#4D5B3C]">메뉴 후보 관리</DrawerTitle>
            <p className="mt-1 text-xs text-[#4D5B3C]/70">등록된 메뉴 {foods.length}개 · 자동 저장</p>
          </div>
          <button type="button" onClick={() => setMenuDrawerOpen(false)}
            aria-label="닫기" className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#4D5B3C] hover:bg-[#D9D8B8]">
            <X size={19} aria-hidden="true" />
          </button>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-[#4D5B3C]">
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <input aria-label="추가할 메뉴 이름" maxLength={30} value={draft} onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 부대찌개" className="min-h-12 min-w-0 flex-[1_1_160px] rounded-xl border border-[#D9D8B8] bg-white px-4 text-base outline-offset-2" />
            <button type="submit" disabled={!member || syncBusy || !draft.trim() || foods.some((food) => food.name.toLocaleLowerCase() === draft.trim().toLocaleLowerCase())} className={primary}>+ 추가</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {foods.map((food) => <span key={food.name} className="inline-flex max-w-full items-center rounded-full bg-[#EFE6D4] pl-3 text-sm font-medium">
              <span className="min-w-0 break-all py-2">{food.name}</span>
              <button type="button" disabled={!member || syncBusy} aria-label={`${food.name} 삭제`} onClick={() => void remove(food.name)}
                className="min-h-10 min-w-10 rounded-full text-lg hover:bg-[#D9D8B8]">×</button>
            </span>)}
            {foods.length === 0 && <p className="text-sm opacity-70">아직 등록된 메뉴가 없어. 첫 메뉴를 추가해줘!</p>}
          </div>
        </div>
      </DepthDrawer>
    </main>
  </Shell>;
}
