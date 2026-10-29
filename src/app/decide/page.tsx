'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { foodCategories, normalizeFoodCategory, type FoodCategory } from '@/lib/food-categories';
import { Shell } from '@/components/shell';
import { Plus, X, Pencil, Trash2, Search, ArrowLeft, Share2 } from 'lucide-react';
import SwipeRow, { type SwipeAction } from '@/components/SwipeRow';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ElectricBorder from '@/components/ElectricBorder';
import { Floating3DParticles } from '@/components/ui/floating-3d-particles';
import { BorderBeam } from '@/components/ui/border-beam';
import { DrawConfetti } from '@/components/ui/draw-confetti';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AnimatePresence, motion } from 'motion/react';
import './decide-ticket.css';

type DecideFoodRow = { id: string; name: string; moods: string[]; category: string; icon: string; created_at: string };
const decideDb = createClient();
type Mood = 'all' | 'spicy' | 'soup' | 'hearty';
type Mode = 'kuji' | 'battle' | 'fortune' | 'random';
type Food = { name: string; moods: Mood[]; category: FoodCategory; icon: string };
const ICON_OPTIONS = ['🍚', '🍜', '🍣', '🍝', '🥩', '🍔', '🍗', '🥟', '🍕', '🍲', '🍰', '🥗', '🍽️'];
const CATEGORY_EMOJI: Record<FoodCategory, string> = { 한식: '🍚', 중식: '🥟', 일식: '🍣', 양식: '🍝', 디저트: '🍰', 기타: '🍽️' };
const INITIAL_CATEGORIES: Record<string, FoodCategory> = { 김치찌개: '한식', 돈까스: '일식', 초밥: '일식', 제육볶음: '한식', 파스타: '양식', 햄버거: '양식', 쌀국수: '기타', 마라탕: '중식' };
const normalizeFood = (item: { name: string; moods: Mood[]; category?: string; icon?: string }): Food => ({ ...item, category: normalizeFoodCategory(item.category ?? INITIAL_CATEGORIES[item.name]), icon: item.icon || CATEGORY_EMOJI[normalizeFoodCategory(item.category ?? INITIAL_CATEGORIES[item.name])] });
const STORAGE_KEY = 'mumukg-decide-foods-v1';
const HISTORY_KEY = 'mumukg-decide-recent-picks-v1';
const RECENT_LIMIT = 3;
const INITIAL: Food[] = ([
  { name: '김치찌개', moods: ['spicy', 'soup', 'hearty'] },
  { name: '돈까스', moods: ['hearty'] },
  { name: '초밥', moods: [] },
  { name: '제육볶음', moods: ['spicy', 'hearty'] },
  { name: '파스타', moods: [] },
  { name: '햄버거', moods: ['hearty'] },
  { name: '쌀국수', moods: ['soup'] },
  { name: '마라탕', moods: ['spicy', 'soup'] },
] as Array<{ name: string; moods: Mood[] }>).map(normalizeFood);
const MOODS: { id: Mood; label: string }[] = [
  { id: 'all', label: '🎲 아무거나' },
  { id: 'spicy', label: '🌶️ 매콤' },
  { id: 'soup', label: '🍜 국물' },
  { id: 'hearty', label: '🍖 든든' },
];
const MODES: { id: Mode; label: string; description: string }[] = [
  { id: 'kuji', label: '🎟️ 뽑기', description: '뜯어서 뽑기' },
  { id: 'battle', label: '🏆 빠른 배틀', description: '둘 중 하나씩' },
  { id: 'fortune', label: '🥠 음식 운세', description: '오늘의 한마디' },
  { id: 'random', label: '🎲 개랜덤', description: '누르면 바로 결정' },
];
const FORTUNES = [
  '오늘은 이 메뉴가 널 선택했어! ✨',
  '맛있는 운명이 정해졌습니다. 🍀',
  '더 고민하면 배만 고파져! 😋',
  '오늘의 행운은 한 입에서 시작돼. 🥢',
  '오늘은 이거 먹고 기분 좋은 하루! 🌿',
];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
// 베이지 배경과 대비되는 짙고 선명한 색상으로 쿠지마다 새로운 조합을 만든다.
const LIGHTNING_COLORS = ['#A52B5D', '#245CC2', '#6C35A9', '#087E86', '#C04B24', '#287143', '#B12649', '#334F9A'];
const randomLightningColors = (): [string, string, string] => {
  const shuffled = [...LIGHTNING_COLORS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return [shuffled[0], shuffled[1], shuffled[2]];
};


export default function Decide() {
  const { user, openSignIn } = useAuth();
  return <DecideSession key={user?.id ?? 'anonymous'} account={user?.id ?? null} openSignIn={openSignIn} />;
}

function DecideSession({ account, openSignIn }: { account: string | null; openSignIn: () => void }) {
  const [foods, setFoods] = useState<Food[]>(INITIAL);
  const [rows, setRows] = useState<DecideFoodRow[]>([]);
  const [member, setMember] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const [localBackup, setLocalBackup] = useState<Food[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [listCategory, setListCategory] = useState<FoodCategory | '전체'>('전체');
  const [pendingDelete, setPendingDelete] = useState<Food | null>(null);
  const [swipeVersion, setSwipeVersion] = useState(0);
  const [mode, setMode] = useState<Mode>('kuji');
  const [choice, setChoice] = useState('');
  const [fortune, setFortune] = useState('');
  const [excludeRecent, setExcludeRecent] = useState(false);
  const [recentPicks, setRecentPicks] = useState<string[]>([]);
  const recordedTicket = useRef(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<FoodCategory>('한식');
  const [draftIcon, setDraftIcon] = useState('🍚');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | '전체'>('전체');
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [battle, setBattle] = useState<string[]>([]);
  const [battleStep, setBattleStep] = useState(0);
  const [ticket, setTicket] = useState<number | null>(null);
  const [lightningColors, setLightningColors] = useState<[string, string, string]>(['#A52B5D', '#245CC2', '#087E86']);
  const [tear, setTear] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const tearStart = useRef(0);
  const tearPosition = useRef(0);
  const lastVibration = useRef(0);
  const lastTearPosition = useRef(0);
  const shareResult = async () => {
    if (!choice) return;
    const message = '오늘의 메뉴는 '+choice+'! 🍽️';
    try {
      if (window.MumukgNative?.isNative) await window.MumukgNative.share({title:'오늘의 메뉴',message});
      else if (navigator.share) await navigator.share({title:'오늘의 메뉴',text:message});
      else await navigator.clipboard.writeText(message);
    } catch { /* User may dismiss the native share sheet. */ }
  };
  const nativeHaptic = (type: 'selection' | 'success' | 'warning' | 'error') => {
    if (typeof window !== 'undefined') void window.MumukgNative?.triggerHaptic(type).catch(() => undefined);
  };
  const vibrate = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.MumukgNative) return; // Native feedback is handled by RN.
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((food) =>
          food && typeof food.name === 'string' && food.name.length <= 30 &&
          Array.isArray(food.moods) && food.moods.every((mood: unknown) => MOODS.some((m) => m.id === mood))
        )) {
          const backup = (parsed as Array<{ name: string; moods: Mood[]; category?: string; icon?: string }>).map(normalizeFood);
          queueMicrotask(() => { setLocalBackup(backup); setFoods(backup); });
        }
      }
    } catch { /* 저장 데이터가 손상되면 기본 후보 사용 */ }
  }, []);
  // Preserve legacy localStorage as read-only backup; remote data must never overwrite it.
  useEffect(() => {
    try {
      const history: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
      if (Array.isArray(history)) queueMicrotask(() => setRecentPicks(history.filter((name): name is string => typeof name === 'string').slice(0, RECENT_LIMIT)));
    } catch { /* Ignore invalid history. */ }
  }, []);

  useEffect(() => {
    const db = decideDb;
    if (!db || !account) return;
    let disposed = false;
    const load = async () => {
      const { data: membership, error: membershipError } = await db.from('decide_members')
        .select('user_id').eq('user_id', account).maybeSingle();
      if (disposed) return;
      if (membershipError) { setSyncError(membershipError.message); setMember(false); return; }
      if (!membership) { setMember(false); setRows([]); return; }
      const { data, error } = await db.from('decide_foods')
        .select('id,name,moods,category,icon,created_at').order('created_at', { ascending: true });
      if (disposed) return;
      if (error) { setSyncError(error.message); return; }
      setRows((data ?? []) as DecideFoodRow[]);
      setFoods((data ?? []).map(({ name, moods, category, icon }) => normalizeFood({ name, moods: moods as Mood[], category, icon })));
      setMember(true);
      setSyncError('');
    };
    void load();
    return () => { disposed = true; };
  }, [account]);

  const reloadFoods = useCallback(async () => {
    if (!decideDb) return;
    const { data, error } = await decideDb.from('decide_foods')
      .select('id,name,moods,category,icon,created_at').order('created_at', { ascending: true });
    if (error) { setSyncError(error.message); return; }
    setRows((data ?? []) as DecideFoodRow[]);
    setFoods((data ?? []).map(({ name, moods, category, icon }) => normalizeFood({ name, moods: moods as Mood[], category, icon })));
    setSyncError('');
  }, []);
  useEffect(() => {
    if (!member || !account || !decideDb) return;
    const db = decideDb;
    const channel = db.channel(`decide-foods-${account}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decide_foods' }, () => { void reloadFoods(); })
      .subscribe();
    const refresh = () => { if (document.visibilityState === 'visible') void reloadFoods(); };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); void db.removeChannel(channel); };
  }, [account, member, reloadFoods]);
  const importLocalFoods = async () => {
    if (!decideDb || !member) return;
    setSyncBusy(true);
    try {
      const names = new Set(rows.map((row) => row.name.trim().toLocaleLowerCase()));
      const toImport = localBackup.filter((food) => {
        const key = food.name.trim().toLocaleLowerCase();
        if (!key || key.length > 30 || names.has(key)) return false;
        names.add(key);
        return true;
      }).map((food) => ({ name: food.name.trim(), moods: food.moods, category: food.category, icon: food.icon, created_by: account }));
      if (toImport.length) {
        const { error } = await decideDb.from('decide_foods').insert(toImport);
        if (error) throw error;
      }
      await reloadFoods();
      setSyncError(toImport.length ? `로컬 후보 ${toImport.length}개 가져왔어.` : '가져올 새로운 후보가 없어.');
    } catch (error) { setSyncError(error instanceof Error ? error.message : '가져오기 실패'); }
    setSyncBusy(false);
  };

  const visibleFoods = foods.filter((food) => (listCategory === '전체' || food.category === listCategory) && food.name.toLocaleLowerCase().includes(menuSearch.trim().toLocaleLowerCase()));
  const categoryPool = mode === 'random' || categoryFilter === '전체' ? foods : foods.filter((food) => food.category === categoryFilter);
  const available = excludeRecent ? categoryPool.filter((food) => !recentPicks.includes(food.name)) : categoryPool;
  const pool = available.length ? available : categoryPool;
  const recentFallback = excludeRecent && available.length === 0 && categoryPool.length > 0;
  const rememberPick = (name: string) => {
    setRecentPicks((previous) => {
      const next = [name, ...previous.filter((item) => item !== name)].slice(0, RECENT_LIMIT);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* Private mode may block storage. */ }
      return next;
    });
  };
  const reset = () => { recordedTicket.current = false; tearPosition.current = 0; setChoice(''); setFortune(''); setBattle([]); setBattleStep(0); setTicket(null); setTear(0); setDragging(false); startX.current = null; };
  const changeMode = (next: Mode) => { setMode(next); reset(); };

  const draw = () => {
    if (!pool.length) return;
    const options = pool.filter((food) => food.name !== choice);
    const name = pick(options.length ? options : pool).name;
    setChoice(name);
    rememberPick(name);
    setFortune(pick(FORTUNES));
  };
  const openTicket = (number: number) => {
    if (!pool.length) return;
    const options = pool.filter((food) => food.name !== choice);
    setChoice(pick(options.length ? options : pool).name);
    recordedTicket.current = false;
    setTicket(number);
    nativeHaptic('selection');
    setLightningColors(randomLightningColors());
    tearTo(0);
    setDragging(false);
    lastTearPosition.current = 0;
  };
  const tearTo = (value: number) => {
    const next = Math.max(0, Math.min(100, value));
    tearPosition.current = next;
    setTear(next);
    if (next === 100 && !recordedTicket.current && choice) { recordedTicket.current = true; rememberPick(choice); }
  };
  const moveTear = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const width = event.currentTarget.parentElement?.getBoundingClientRect().width || 1;
    const next = Math.max(0, Math.min(100, tearStart.current + (event.clientX - startX.current) / width * 100));
    tearTo(next);
    const now = performance.now();
    // Android: 뜯는 진행도에 맞춰 짧고 뚜렷한 펄스를 점점 촘촘하게 준다.
    const interval = next >= 80 ? 65 : next >= 50 ? 85 : 110;
    const distance = next >= 80 ? 3 : next >= 50 ? 4 : 5;
    if (Math.abs(next - lastTearPosition.current) >= distance && now - lastVibration.current >= interval) {
      nativeHaptic('selection');
      vibrate(next >= 80 ? 28 : next >= 50 ? 21 : 15);
      lastVibration.current = now;
      lastTearPosition.current = next;
    }
  };
  const endTear = () => {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    vibrate(0);
    // 95% 이상에서만 개봉. 중단하면 처음부터 다시 뜯도록 되돌린다.
    if (tearPosition.current >= 95) {
      tearTo(100);
      nativeHaptic('success');
      vibrate([42, 35, 65]);
    } else {
      tearTo(0);
    }
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
    if (battle.length <= 2) { setChoice(name); rememberPick(name); setBattle([]); return; }
    if (battleStep === 0) { setBattle((items) => [items[2], items[3], name].filter(Boolean)); setBattleStep(1); }
    else { setBattle((items) => [items[2], name].filter(Boolean)); setBattleStep(2); }
  };
  const requestDelete = (food: Food) => {
    setSwipeOpenId(null);
    setSwipeVersion((version) => version + 1);
    if (!member) { setSyncError('삭제하려면 멤버 승인이 필요해.'); return; }
    setPendingDelete(food);
  };
  const startEdit = (food: Food) => {
    const row = rows.find((item) => item.name === food.name);
    if (!member || !row) { setSyncError('메뉴 수정은 로그인 및 멤버 승인 후 사용할 수 있어.'); return; }
    if (syncBusy) return;
    setEditingId(row.id);
    setDraft(food.name);
    setDraftCategory(food.category);
    setDraftIcon(food.icon);
    setSwipeOpenId(null);
    setFormOpen(true);
  };
  const cancelEdit = () => { setEditingId(null); setDraft(''); setSwipeOpenId(null); };
  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name || foods.some((food) => food.name.toLocaleLowerCase() === name.toLocaleLowerCase() && rows.find((row) => row.name === food.name)?.id !== editingId)) return;
    if (!member || !decideDb) { setSyncError('로그인 및 멤버 승인 후 수정할 수 있어.'); return; }
    setSyncBusy(true);
    const payload = { name, category: draftCategory, icon: draftIcon };
    const { error } = editingId
      ? await decideDb.from('decide_foods').update(payload).eq('id', editingId)
      : await decideDb.from('decide_foods').insert({ ...payload, moods: [], created_by: account });
    if (error) setSyncError(error.message);
    else { await reloadFoods(); cancelEdit(); setFormOpen(false); reset(); }
    setSyncBusy(false);
  };
  const remove = async (name: string) => {
    if (!member || !decideDb) { setSyncError('메뉴 삭제는 로그인 및 멤버 승인 후 사용할 수 있어.'); return; }
    const row = rows.find((item) => item.name === name);
    if (!row) return;
    setSyncBusy(true);
    const { error } = await decideDb.from('decide_foods').delete().eq('id', row.id);
    if (error) setSyncError(error.message);
    else { await reloadFoods(); setSwipeOpenId(null); reset(); }
    setPendingDelete(null);
    setSyncBusy(false);
  };

  const primary = 'min-h-12 rounded-2xl bg-[#4D5B3C] px-5 font-bold text-[#EFE6D4] disabled:cursor-not-allowed disabled:opacity-40';

  return <Shell tone="editorial">
    <main className="min-w-0 space-y-5 pb-12 text-[#4D5B3C]">
      <header className="rounded-3xl bg-[#EFE6D4] p-5 sm:p-7">
        <p className="text-sm font-semibold opacity-70">고민 해결 연구소</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">오늘 뭐 먹지? 🍽️</h1>
        <p className="mt-2 text-sm opacity-75">메뉴는 등록해두고, 결정은 운명에 맡겨봐!</p>
      </header>

      <section className="rounded-2xl border border-[#D9D8B8] bg-white p-4 text-sm">
        <p className="font-bold">☁️ 공유 메뉴 후보 {member ? '연결됨' : '로그인 필요'}</p>
        {!decideDb ? <p>Supabase 환경변수 설정이 필요해.</p> :
          !account ? <div className="mt-2 space-y-2"><p>공유 후보를 쓰려면 먼저 로그인해 줘.</p><button type="button" onClick={openSignIn} className="min-h-10 rounded-lg bg-[#4D5B3C] px-4 text-white">로그인</button></div> :
          <div className="mt-2 space-y-2">
            <p>{member ? '모두가 같은 후보를 사용해.' : '로그인됐어. 멤버 승인 후 공유 후보를 사용할 수 있어.'}</p>
            <div className="flex flex-wrap gap-2">
              {member && <><button type="button" onClick={() => void reloadFoods()} className="rounded-lg border px-3 py-2">새로고침</button>
                <button type="button" disabled={syncBusy} onClick={() => void importLocalFoods()} className="rounded-lg border px-3 py-2">기존 후보 가져오기</button></>}
            </div>
          </div>}
        {syncError && <p role="status" className="mt-2 break-words text-xs">{syncError}</p>}
      </section>
      <section aria-label="랜덤뽑기 음식 분류" className="rounded-2xl border border-[#D9D8B8] bg-white p-4">
        <p className="mb-3 text-sm font-bold">어떤 메뉴를 뽑을까?</p>
        <div className="flex flex-wrap gap-2">
          {(['전체', ...foodCategories] as const).map((category) => (
            <button key={category} type="button" onClick={() => { setCategoryFilter(category); reset(); }}
              aria-pressed={categoryFilter === category}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors ${categoryFilter === category ? 'border-[#4D5B3C] bg-[#4D5B3C] text-white' : 'border-[#D9D8B8] bg-[#EFE6D4]'}`}>
              {category === '전체' ? '🎲 전체' : `${CATEGORY_EMOJI[category]} ${category}`}
              <span className="ml-1 opacity-70">{category === '전체' ? foods.length : foods.filter((item) => item.category === category).length}</span>
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={excludeRecent} onChange={(event) => { setExcludeRecent(event.target.checked); reset(); }} className="size-4 accent-[#4D5B3C]"/> 최근 뽑힌 메뉴 {RECENT_LIMIT}개 제외</label>
        {excludeRecent && recentFallback && <p className="mt-2 text-xs text-[#B4534B]">남은 후보가 없어서 최근 메뉴도 포함했어.</p>}
      </section>
      <section aria-label="뽑기 방식" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id}
          onClick={() => changeMode(item.id)}
          className={`min-w-0 rounded-2xl border p-3 text-center transition-colors ${mode === item.id ? 'border-[#4D5B3C] bg-[#D9D8B8]' : 'border-[#D9D8B8] bg-white'}`}>
          <span className="block text-sm font-bold sm:text-base">{item.label}</span>
          <span className="mt-1 hidden text-xs opacity-70 sm:block">{item.description}</span>
        </button>)}
      </section>

      {mode === 'kuji' && <div className="text-center text-sm">
        <p className="font-semibold">{ticket === null ? '마음에 드는 뽑기권을 한 장 골라봐!' : `NO. ${String(ticket).padStart(2, '0')} · ${tear === 100 ? '당첨!' : '절취선을 오른쪽으로 밀어 뜯어봐!'}`}</p>
        <p className="mt-1 text-xs opacity-70">종이 뽑기 · 후보 {pool.length}개</p>
      </div>}
      <section aria-label="메뉴 추천 결과" className={`rounded-3xl text-center ${mode === 'kuji' ? 'bg-transparent p-0' : 'bg-[#EFE6D4] p-5 sm:p-8'}`}>
        {mode !== 'kuji' && <p className="text-sm opacity-70">{mode === 'battle' ? '취향 대결' : mode === 'fortune' ? '오늘의 음식 운세' : '완전 무작위'} · 후보 {pool.length}개</p>}
        {mode === 'kuji' ? <div className="py-3">
          {ticket === null ? <>
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 sm:gap-5">
              {Array.from({ length: 6 }, (_, index) => <button key={index} type="button" disabled={!pool.length}
                onClick={() => openTicket(index + 1)}
                className="paper-ticket relative flex aspect-[4/5] min-w-0 flex-col items-center justify-between overflow-hidden rounded-[3px] border border-[#B9AD8C] px-2 py-3 shadow-[1px_2px_0_#C8BDA0,3px_5px_9px_#4D5B3C20] transition-transform hover:-translate-y-1 hover:rotate-[-1deg] active:scale-95 disabled:opacity-40">
                <span className="text-[9px] font-bold tracking-[0.2em] sm:text-[10px]">MENU LOTTERY</span>
                <span className="flex size-12 items-center justify-center rounded-full border border-[#4D5B3C]/20 text-4xl font-black text-[#4D5B3C]/80">?</span>
                <span className="w-full border-t-2 border-dashed border-[#A5A78B] pt-2 text-[10px] font-bold tracking-widest">NO. {String(index + 1).padStart(2, '0')}</span>
              </button>)}
            </div>
          </> : tear === 100 ? <div className="relative isolate mx-auto flex min-h-72 w-full max-w-xl items-center justify-center overflow-hidden rounded-2xl bg-[#E7DFC8] px-2 py-6 sm:px-6 sm:py-10">
            <Floating3DParticles quantity={260} color="#AB8240" size={3.5} opacity={0.65} drift={0.28} depth={0.55} className="z-0" />
            <DrawConfetti />
            <motion.div key={`result-${ticket}-${choice}`} initial={{ opacity: 0, y: 45, scale: 0.78, rotate: -5 }} animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 245, damping: 17, delay: 0.1 }} className="relative z-10 w-full max-w-sm rounded-2xl border border-[#4D5B3C]/30 bg-[#FFFCF2] px-6 py-8 shadow-[0_20px_55px_#343B2C45] sm:px-8">
              <div className="mb-6 flex items-center justify-between border-b border-dashed border-[#B8B69D] pb-3 text-[11px] font-bold tracking-[0.2em] text-[#76805C]"><span>MUMUKG DRAW</span><span>NO. {String(ticket).padStart(2, "0")}</span></div>
              <div className="text-center"><span className="text-5xl" aria-hidden="true">{foods.find((food) => food.name === choice)?.icon ?? "🍽️"}</span><p className="mt-4 text-xs font-semibold tracking-widest opacity-60">오늘의 당첨 메뉴</p><strong className="mt-2 block break-keep text-3xl font-black sm:text-4xl">{choice}</strong><p className="mt-4 text-sm opacity-75">오늘은 이걸로 결정! ✨</p></div>
              <div className="mt-7 border-t border-dashed border-[#B8B69D] pt-3 text-center text-[10px] font-semibold tracking-widest opacity-50">YOUR LUCKY PICK</div>
              <BorderBeam size={85} duration={5} colorFrom="#E6B65C" colorTo="#82985A" borderWidth={2} />
            </motion.div>
          </div> : <div className="mx-auto max-w-md">
            <ElectricBorder color="#A47536" colors={lightningColors} glowColor="#594A35" speed={1.5} chaos={0.8} glow={1.8} intensity={1.7} thickness={2} spread={1} arcs={2} active={tear < 100} intro={false} interactive={false} canvasAbove borderRadius={12} className="w-full">
            <motion.div className="paper-ticket paper-ticket-large relative h-56 overflow-hidden rounded-[3px] border border-[#B9AD8C] shadow-[1px_2px_0_#C8BDA0,4px_7px_12px_#4D5B3C25]"
              animate={dragging && tear > 0 && tear < 100 ? {
                x: [-1, 1, -0.8, 0.8, 0].map((value) => value * (2 + tear * 0.045)),
                rotate: [-1, 1, -0.8, 0.8, 0].map((value) => value * (0.4 + tear * 0.009)),
              } : { x: 0, rotate: 0 }}
              transition={dragging && tear > 0 && tear < 100 ? { duration: Math.max(0.075, 0.14 - tear * 0.0006), repeat: Infinity, ease: "linear" } : { duration: 0.12 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-5" aria-live="polite">
                <span className="sr-only">절취 부분을 밀어 메뉴를 확인해 봐.</span>
              </div>
              <div className="pointer-events-none absolute inset-x-5 top-4 z-[1] border-b border-dotted border-[#B6B19B] pb-2 text-[10px] font-bold tracking-[0.2em] text-[#6D654E]">MUMUKG · PAPER DRAW</div>
              <div className="pointer-events-none absolute inset-x-5 bottom-4 z-[1] border-t border-dotted border-[#B6B19B] pt-2 text-[10px] font-bold tracking-widest text-[#6D654E]">NO. {String(ticket).padStart(2, '0')} · LUCKY TICKET</div>
              <div className="absolute inset-x-3 top-[27%] bottom-[27%] border-y border-dashed border-[#A39779]/65 bg-[#E7DDC7]/55 shadow-[inset_0_2px_5px_#6F593519]" aria-hidden="true">
                <span className="flex h-full items-center justify-center text-sm font-bold tracking-widest text-[#75694E]">✦ OPEN ✦</span>
              </div>
              <div className="paper-ticket paper-ticket-cover paper-ticket-strip absolute inset-x-3 top-[27%] bottom-[27%] z-[2] flex flex-col items-center justify-center"
                style={{ clipPath: 'inset(0 0 0 ' + tear + '%)' }} aria-hidden="true">
                <span className="rounded-sm border border-[#8D8063]/30 px-2 py-0.5 text-[9px] font-black tracking-[0.3em] text-[#887859]">SEALED</span>
                <strong className="mt-2 text-lg font-black tracking-widest text-[#554D38] sm:text-xl">비밀 메뉴</strong>
                <span className="mt-1 text-[10px] tracking-widest text-[#716244]">옆으로 뜯어 열기</span>
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
              {tear < 100 && <div className="paper-tear-handle absolute top-[27%] bottom-[27%] z-10 flex w-10 -translate-x-1/2 items-center justify-center"
                role="slider" aria-label="종이 절취선" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tear)} tabIndex={0}
                style={{ left: Math.max(8, Math.min(92, tear)) + '%', touchAction: 'none' }}
                onPointerDown={(event) => { startX.current = event.clientX; tearStart.current = tear; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
                onPointerMove={moveTear} onPointerUp={endTear} onPointerCancel={endTear}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') { event.preventDefault(); tearTo(tear + 20); }
                  if (event.key === 'ArrowLeft') { event.preventDefault(); tearTo(tear - 20); }
                  if (['End', 'Enter', ' '].includes(event.key)) { event.preventDefault(); tearTo(100); }
                }}>
                <span className="rounded-sm border border-[#A79A7A] bg-[#F5ECD7] px-1.5 py-3 text-xs font-black text-[#716244] shadow-[1px_2px_3px_#72624430]">››</span>
              </div>}
            </motion.div>
            </ElectricBorder>
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
            <span className="text-5xl" aria-hidden="true">{mode === 'fortune' ? '🥠' : mode === 'random' ? '🎲' : '🏆'}</span>
            <h2 className="break-keep text-2xl font-black sm:text-3xl">{choice || (mode === 'battle' ? '오늘의 승자는?' : '오늘 뭘 먹을까?')}</h2>
            {choice && mode !== 'random' && <p className="text-sm">{mode === 'fortune' ? fortune : '오늘은 이걸로 결정! ✨'}</p>}
          </div>}
        {pool.length === 0 && <p className="mb-4 text-sm text-[#B4534B]">이 조건에 맞는 메뉴가 없어. 필터를 바꾸거나 메뉴를 추가해줘.</p>}
        {(mode === 'random' || mode === 'fortune' || (mode === 'battle' && (Boolean(choice) || battle.length < 2))) &&
          <button type="button" disabled={pool.length < (mode === 'battle' ? 2 : 1)}
            onClick={mode === 'battle' ? startBattle : draw} className={primary + ' w-full'}>
            {mode === 'battle' ? (choice ? '🏆 다시 대결하기' : '🏆 배틀 시작하기') : mode === 'random' ? (choice ? '🎲 또 뽑기' : '🎲 개랜덤 뽑기') : choice ? '🥠 다시 뽑기' : '🥠 오늘의 운세 열기'}
          </button>}
        {mode === 'battle' && pool.length === 1 && <p className="mt-2 text-xs">배틀에는 후보가 최소 2개 필요해.</p>}
      </section>

      {mode === 'kuji' && ticket !== null && <div className="relative z-10 mx-auto grid w-full max-w-md grid-cols-2 gap-3 px-1">
        <button type="button" onClick={reset} className={primary}>🎟️ 다시 뽑기</button>
        <button type="button" disabled={tear === 100} onClick={() => { tearTo(100); nativeHaptic('success'); vibrate([42, 35, 65]); }}
          className="min-h-12 rounded-2xl border border-[#4D5B3C] bg-white px-3 text-sm font-bold text-[#4D5B3C] disabled:cursor-not-allowed disabled:opacity-40">바로 열기</button>
      </div>}

      {choice && (mode !== 'kuji' || tear === 100) && <div className="mx-auto mt-3 max-w-md px-1"><button type="button" onClick={() => void shareResult()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#4D5B3C] bg-[#FBF8F0] text-sm font-bold text-[#4D5B3C]"><Share2 size={16}/>결과 공유하기</button></div>}
      {!menuDrawerOpen && <button type="button" onClick={() => setMenuDrawerOpen(true)}
        aria-label="메뉴 후보 관리 열기" title="메뉴 후보 관리"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-12 items-center justify-center rounded-full border border-[#4D5B3C] bg-[#4D5B3C] text-[#EFE6D4] shadow-lg transition-transform active:scale-95">
        <Plus size={22} strokeWidth={2.25} aria-hidden="true" />
      </button>}
      <DepthDrawer open={menuDrawerOpen} depth={1} onClose={() => { if (formOpen) { cancelEdit(); setFormOpen(false); } else setMenuDrawerOpen(false); }}>
        <DrawerHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[#D9D8B8] px-5 py-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] text-left">
          <div className="min-w-0">
            <DrawerTitle className="text-lg font-bold text-[#4D5B3C]">{formOpen ? (editingId ? "메뉴 수정" : "새 메뉴 추가") : "메뉴 후보 관리"}</DrawerTitle>
            <p className="mt-1 text-xs text-[#4D5B3C]/70">{formOpen ? "분류, 아이콘, 메뉴명을 입력해 줘" : `등록된 메뉴 ${foods.length}개 · 자동 저장`}</p>
          </div>
          <button type="button" onClick={() => { if (formOpen) { cancelEdit(); setFormOpen(false); } else setMenuDrawerOpen(false); }}
            aria-label={formOpen ? "목록으로 돌아가기" : "닫기"} className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#4D5B3C] hover:bg-[#D9D8B8]">
            {formOpen ? <ArrowLeft size={19} aria-hidden="true" /> : <X size={19} aria-hidden="true" />}
          </button>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-[#4D5B3C]">
          {formOpen ? <form onSubmit={add} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain rounded-xl bg-[#EFE6D4]/60 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <label className="min-w-0 text-xs font-semibold">분류
                <select aria-label="메뉴 분류" value={draftCategory}
                  onChange={(event) => { const category = event.target.value as FoodCategory; setDraftCategory(category); setDraftIcon(CATEGORY_EMOJI[category]); }}
                  className="mt-1 block min-h-12 w-full rounded-xl border border-[#D9D8B8] bg-white px-3 text-base">
                  {foodCategories.map((category) => <option key={category} value={category}>{CATEGORY_EMOJI[category]} {category}</option>)}
                </select>
              </label>
              <div className="flex size-12 items-center justify-center rounded-xl bg-white text-2xl" aria-hidden="true">{draftIcon}</div>
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold">아이콘</legend>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((icon) => <button key={icon} type="button" onClick={() => setDraftIcon(icon)}
                  aria-label={`아이콘 ${icon}`} aria-pressed={draftIcon === icon}
                  className={`flex size-10 items-center justify-center rounded-lg border text-xl ${draftIcon === icon ? 'border-[#4D5B3C] bg-[#D9D8B8]' : 'border-[#D9D8B8] bg-white'}`}>{icon}</button>)}
              </div>
            </fieldset>
            <label className="block text-xs font-semibold">메뉴명
              <input aria-label="추가할 메뉴 이름" maxLength={30} value={draft} onChange={(event) => setDraft(event.target.value)}
                placeholder="예: 부대찌개" className="mt-1 min-h-12 w-full rounded-xl border border-[#D9D8B8] bg-white px-4 text-base outline-offset-2" />
            </label>
            <div className="flex gap-2"><button type="button" onClick={() => { cancelEdit(); setFormOpen(false); }} className="min-h-12 rounded-2xl border border-[#D9D8B8] px-4 font-semibold">취소</button><button type="submit" disabled={!member || syncBusy || !draft.trim() || foods.some((food) => food.name.toLocaleLowerCase() === draft.trim().toLocaleLowerCase() && rows.find((row) => row.name === food.name)?.id !== editingId)} className={primary + ' flex-1'}>{editingId ? '수정 저장' : '+ 후보 등록'}</button></div>
          </form> : <>
          <button type="button" onClick={() => { cancelEdit(); setDraftCategory("한식"); setDraftIcon("🍚"); setFormOpen(true); }} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4D5B3C] px-4 font-bold text-white"><Plus size={18}/> 새 메뉴 추가</button>
          <div className="flex shrink-0 items-center gap-2">
            <Search size={17} aria-hidden="true"/>
            <input type="search" aria-label="메뉴 검색" placeholder="메뉴 검색" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-[#D9D8B8] px-3 text-sm"/>
            <select aria-label="목록 분류" value={listCategory} onChange={(event) => setListCategory(event.target.value as FoodCategory | '전체')} className="min-h-10 rounded-lg border border-[#D9D8B8] bg-white px-2 text-sm">
              <option value="전체">전체</option>
              {foodCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
            <p className="py-2 text-xs opacity-70">왼쪽으로 밀면 수정·삭제 · 끝까지 밀면 삭제</p>
            <div className="overflow-hidden border-y border-[#D9D8B8] bg-white">
            {visibleFoods.map((food) => <div key={`${food.name}-${swipeVersion}`} className="border-b border-[#E6E3D6] last:border-b-0"><SwipeRow direction="left" height={68} radius={0} rowColor="#ffffff" textColor="#4D5B3C" drawerColor="#3f3f46" actionColor="#b4534b" actionWidth={76} fullSwipe={member} closeOnAction disabled={syncBusy} label={food.name} open={swipeOpenId === food.name} onOpenChange={(open) => setSwipeOpenId(open ? food.name : null)} actions={[
              { id: 'delete', label: '삭제', icon: <Trash2 size={19}/>, onSelect: () => requestDelete(food) },
              { id: 'edit', label: '수정', color: '#3f3f46', icon: <Pencil size={19}/>, onSelect: () => startEdit(food) },
            ] satisfies SwipeAction[]}><div className="flex h-full w-full min-w-0 flex-1 items-center gap-3 bg-white">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EFE6D4] text-2xl">{food.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#4D5B3C]/60">{food.category}</p>
                <p className="break-words font-semibold">{food.name}</p>
              </div>
            </div></SwipeRow></div>)}
            </div>
            {visibleFoods.length === 0 && <p className="py-4 text-sm opacity-70">표시할 메뉴가 없어. 검색이나 분류를 바꿔줘.</p>}
          </div>
          </>}
        </div>
      </DepthDrawer>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴를 삭제할까?</AlertDialogTitle>
            <AlertDialogDescription>‘{pendingDelete?.name}’을 공유 메뉴 후보에서 삭제해. 다른 친구의 목록에서도 사라져.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncBusy}>취소</AlertDialogCancel>
            <AlertDialogAction disabled={syncBusy} onClick={(event) => { event.preventDefault(); if (pendingDelete) void remove(pendingDelete.name); }}>삭제하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  </Shell>;
}
