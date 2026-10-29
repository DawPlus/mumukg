'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, ChevronRight, Plus, X, Search, CloudUpload } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { syncStoryRecords, saveStoryRecord, deleteStoryRecord } from '@/lib/story-db';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { Shell } from '@/components/shell';
import { StoryRankCloud } from '@/components/story-rank-cloud';
import SwipeRow, { type SwipeAction } from '@/components/SwipeRow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  foodCategories,
  getCategoryIconCode,
  getFoodIcon,
  normalizeFoodCategory,
  type FoodCategory,
} from '@/lib/food-categories';
import {
  loadStories,
  recentFoodPicks,
  saveStories,
  storyLabel,
} from '@/lib/story';
import type { FoodStory } from '@/lib/types';
import './story.css';
import './story-motion.css';

type Panel = 'past' | 'day' | 'form';

/* React Bits SwipeRow demo defaults — light row only for story cream surface */
const SWIPE_ROW = {
  direction: 'left' as const,
  height: 64,
  radius: 16,
  actionWidth: 80,
  rowColor: '#fffaf3',
  textColor: '#4d5b3c',
  drawerColor: '#3f3f46',
  actionColor: '#e5484d',
  fullSwipe: true,
  closeOnAction: true,
};

function storySwipeActions(
  _item: FoodStory,
  onEdit: () => void,
  onDelete: () => void,
): SwipeAction[] {
  return [
    {
      id: 'delete',
      label: '삭제',
      icon: (
        <HugeiconsIcon
          icon={Delete02Icon}
          size={20}
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
      onSelect: onDelete,
    },
    {
      id: 'edit',
      label: '수정',
      color: '#3f3f46',
      icon: (
        <HugeiconsIcon
          icon={PencilEdit01Icon}
          size={20}
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
      onSelect: onEdit,
    },
  ];
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayHeading(value: string) {
  const todayIso = today();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayIso = `${y}-${m}-${d}`;

  if (value === todayIso) return { label: '오늘', meta: value.replaceAll('-', '.') };
  if (value === yesterdayIso) return { label: '어제', meta: value.replaceAll('-', '.') };

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { label: value.replaceAll('-', '.'), meta: '' };
  }
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return {
    label: `${month}월 ${day}일`,
    meta: `${weekdays[date.getDay()]}요일 · ${value.replaceAll('-', '.')}`,
  };
}

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-[14px] border border-[#d9d8b8] bg-white px-3 text-[15px] text-[#3f4b32] outline-none focus:border-[#4d5b3c] focus-visible:ring-2 focus-visible:ring-[#66734b]';
const labelClass = 'block text-[13px] font-medium text-[#4d5b3c]';

const initialForm = {
  category: '한식' as FoodCategory,
  name: '',
  eatenAt: '',
  note: '',
};

export default function StoryPage() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const reveal = (delay: number) => reducedMotion ? {} : { initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring' as const, stiffness: 210, damping: 24, delay } };
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | '전체'>('전체');
  const [syncActive, setSyncActive] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [items, setItems] = useState<FoodStory[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [panelStack, setPanelStack] = useState<Panel[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deletingItem, setDeletingItem] = useState<FoodStory | null>(null);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);

  const panelDepth = panelStack.length;
  const activePanel = panelStack[panelStack.length - 1] ?? null;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setItems(loadStories());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: FoodStory[]) {
    try {
      saveStories(next);
      setItems(loadStories());
      return true;
    } catch {
      setError('저장 공간을 사용할 수 없어요. 브라우저 설정을 확인해 줘.');
      return false;
    }
  }

  function closeAllPanels() {
    setPanelStack([]);
    setEditing(null);
    setError('');
    setSwipeOpenId(null);
  }

  function openPastList() {
    setPanelStack(['past']);
    setEditing(null);
    setError('');
  }

  function openDay(iso: string) {
    setSelectedDate(iso);
    setEditing(null);
    setError('');
    setPanelStack((stack) =>
      stack.includes('past') ? ['past', 'day'] : ['day'],
    );
  }

  function startAdd(date?: string) {
    const candidate = date ?? selectedDate ?? today();
    const eatenAt = /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : today();
    setForm({ ...initialForm, eatenAt });
    setEditing(null);
    setError('');
    setSelectedDate(eatenAt);
    setPanelStack((stack) => {
      if (stack.includes('past') && stack.includes('day')) {
        return ['past', 'day', 'form'];
      }
      if (stack.includes('day')) return ['day', 'form'];
      return ['form'];
    });
  }

  function startEdit(item: FoodStory) {
    setForm({
      category: normalizeFoodCategory(item.category),
      name: item.name,
      eatenAt: item.eatenAt,
      note: item.note,
    });
    setEditing(item.id);
    setSelectedDate(item.eatenAt);
    setError('');
    setPanelStack((stack) =>
      stack.includes('past') ? ['past', 'day', 'form'] : ['day', 'form'],
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const category = normalizeFoodCategory(form.category);
    const name = form.name.trim();
    const eatenAt = form.eatenAt.trim() || today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eatenAt) || Number.isNaN(new Date(`${eatenAt}T12:00:00`).getTime()) || eatenAt > today()) {
      setError('날짜를 확인할 수 없어요.');
      return;
    }
    if (!name) { setError('먹은 음식 이름을 입력해 줘.'); return; }
    const wasEditing = Boolean(editing);
    const payload = {
      category,
      name,
      eatenAt,
      place: '',
      note: form.note.trim(),
      rating: null as number | null,
      amount: null as number | null,
      icon: getCategoryIconCode(category),
    };
    const next = editing
      ? items.map((item) =>
          item.id === editing
            ? {
                ...item,
                category: payload.category,
                name: payload.name,
                note: payload.note,
                eatenAt: payload.eatenAt,
                icon: payload.icon,
                place: item.place,
                rating: item.rating,
                amount: item.amount,
              }
            : item,
        )
      : [
          {
            id: crypto.randomUUID(),
            ...payload,
            createdAt: new Date().toISOString(),
          },
          ...items,
        ];
    if (persist(next)) {
      if (syncActive) {
        const saved = editing ? next.find(item => item.id === editing) : next[0];
        if (saved) void saveStoryRecord(saved).catch(() => setSyncMessage('서버 저장 실패: 로컬에는 기록되어 있어. 다시 동기화해 줘.'));
      }
      setSelectedDate(eatenAt);
      const title = wasEditing ? '수정 완료' : '기록 완료';
      // Close to main immediately (no day-list detour). Defer toast so it
      // does not fight the drawer modal, and keep the click-through guard.
      closeAllPanels();
      window.setTimeout(() => {
        toast.add({ title });
      }, 320);
    }
  }

  function confirmDelete(item: FoodStory) {
    const next = items.filter((x) => x.id !== item.id);
    if (persist(next)) {
      if (syncActive) void deleteStoryRecord(item.id).catch(() => setSyncMessage('서버 삭제 실패: 동기화 상태를 확인해 줘.'));
      toast.add({ title: '삭제 완료' });
    }
  }

  const todayIso = today();

  const todayItems = useMemo(
    () =>
      items
        .filter((item) => item.eatenAt === todayIso)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, todayIso],
  );

  const pastGrouped = useMemo(() => {
    const map = new Map<string, FoodStory[]>();
    for (const item of items) {
      if (item.eatenAt >= todayIso) continue;
      const list = map.get(item.eatenAt) ?? [];
      list.push(item);
      map.set(item.eatenAt, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items, todayIso]);

  const dayItems = useMemo(() => {
    if (!selectedDate) return [];
    return items
      .filter((item) => item.eatenAt === selectedDate)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [items, selectedDate]);

  const dayHeading = selectedDate ? formatDayHeading(selectedDate) : null;
  const selectedIsToday = selectedDate === todayIso;
  const quickPicks = useMemo(() => recentFoodPicks(items, 8), [items]);
  const monthly = useMemo(() => {
    const rows = items.filter(item => item.eatenAt.startsWith(todayIso.slice(0, 7)));
    const categories = new Map<string, number>();
    for (const item of rows) categories.set(item.category, (categories.get(item.category) ?? 0) + 1);
    return { total: rows.length, variety: new Set(rows.map(item => storyLabel(item))).size,
      top: [...categories.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] ?? '없음' };
  }, [items, todayIso]);
  const weekly = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const keys = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.eatenAt, (counts.get(item.eatenAt) ?? 0) + 1);
    return keys.map((key) => ({ key, count: counts.get(key) ?? 0, label: String(Number(key.slice(-2))) }));
  }, [items]);
  const weeklyMax = Math.max(1, ...weekly.map(day => day.count));
  const visiblePast = useMemo(() => pastGrouped.map(([day, records]) =>
    [day, records.filter(item =>
      (categoryFilter === '전체' || normalizeFoodCategory(item.category) === categoryFilter) &&
      (storyLabel(item) + ' ' + item.note).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )] as const).filter(([, records]) => records.length > 0), [pastGrouped, search, categoryFilter]);
  async function syncNow() {
    if (syncBusy) return;
    setSyncBusy(true);
    try {
      const merged = await syncStoryRecords(items);
      saveStories(merged);
      setItems(merged);
      setSyncActive(true);
      setSyncMessage('동기화 완료');
    } catch (cause) {
      setSyncMessage(cause instanceof Error ? cause.message : '동기화에 실패했어.');
    } finally { setSyncBusy(false); }
  }

  return (
    <Shell tone="editorial">
      <motion.div {...reveal(0.03)} className="relative"><StoryRankCloud items={items} /></motion.div>
      <motion.section {...reveal(0.14)} className="story-summary mb-5 rounded-2xl border border-[#D9D8B8] bg-[#F7F3E9] p-4 text-[#4D5B3C]" aria-label="이번 달 먹스토리 요약">
        <div className="mb-3 text-sm font-bold">이번 달 먹스토리</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <motion.div whileHover={reducedMotion ? undefined : { y: -3 }} className="story-summary__stat"><motion.div key={monthly.total} initial={reducedMotion ? false : { scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black">{monthly.total}</motion.div><div className="text-xs opacity-70">기록</div></motion.div>
          <motion.div whileHover={reducedMotion ? undefined : { y: -3 }} className="story-summary__stat"><motion.div key={monthly.variety} initial={reducedMotion ? false : { scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black">{monthly.variety}</motion.div><div className="text-xs opacity-70">다양한 메뉴</div></motion.div>
          <motion.div whileHover={reducedMotion ? undefined : { y: -3 }} className="story-summary__stat"><motion.div key={monthly.top} initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="truncate text-base font-black">{monthly.top}</motion.div><div className="text-xs opacity-70">많이 먹은 종류</div></motion.div>
        </div>
        {user && <div className="mt-3 border-t border-[#D9D8B8] pt-3">
          <button type="button" disabled={syncBusy} onClick={() => void syncNow()} className="inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4 disabled:opacity-50"><CloudUpload size={15}/>{syncBusy ? '동기화 중...' : 'Supabase 기록 동기화'}</button>
          {syncMessage && <p role="status" className="mt-1 text-xs">{syncMessage}</p>}
        </div>}
      </motion.section>

      <motion.section {...reveal(0.2)} className="story-weekly mb-5 rounded-2xl border border-[#D9D8B8]/75 bg-[#F6F1E5] px-4 py-4 text-[#4D5B3C]" aria-label="최근 7일 기록">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div><h2 className="text-sm font-bold">지난 7일의 식탁</h2><p className="mt-1 text-xs opacity-65">기록이 쌓일수록 식탁이 채워져요</p></div>
          <span className="rounded-full bg-[#D9D8B8]/65 px-3 py-1 text-xs font-semibold">{weekly.reduce((sum, day) => sum + day.count, 0)}끼 기록</span>
        </div>
        <div className="relative rounded-2xl border border-[#E0DCCB] bg-[#FFFCF5] px-3 pb-3 pt-5 sm:px-5" aria-label="날짜별 식사 기록 수 그래프">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-[34px] top-10 flex flex-col justify-between sm:inset-x-5">
            {[0, 1, 2, 3].map(line => <div key={line} className="border-t border-dashed border-[#DCDDCB]/80" />)}
          </div>
          <div className="relative grid grid-cols-7 gap-1.5 sm:gap-3">
            {weekly.map((day, index) => {
              const active = day.key === todayIso;
              const height = day.count ? Math.max(12, (day.count / weeklyMax) * 100) : 0;
              return <div key={day.key} className="flex min-w-0 flex-col items-center" title={`${day.key} · ${day.count}개`} aria-label={`${day.key}: ${day.count}끼 기록`}>
                <div className="mb-2 flex h-5 items-center justify-center">
                  <span className={`text-[11px] font-bold tabular-nums ${day.count ? 'text-[#4D5B3C]' : 'text-[#B9BCA8]'}`}>{day.count || '·'}</span>
                </div>
                <div className="flex h-28 w-full items-end justify-center sm:h-32">
                  <div className="relative flex h-full w-full max-w-9 items-end justify-center">
                    {day.count > 0 ? <motion.div
                      initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: `${height}%`, opacity: 1 }}
                      transition={{ delay: index * 0.07, duration: 0.65, type: 'spring', bounce: 0.12 }}
                      className={`w-full rounded-t-xl rounded-b-md ${active ? 'bg-[#4D5B3C]' : 'bg-[#9BA984]'}`}
                    >
                      <div className="mx-auto mt-1.5 h-1 w-1/2 rounded-full bg-white/35" />
                    </motion.div> : <div className="h-1 w-full rounded-full bg-[#D6D8C6]" />}
                  </div>
                </div>
                <div className={`mt-2 flex h-6 min-w-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums sm:px-2 ${active ? 'bg-[#4D5B3C] text-white' : 'text-[#777D66]'}`}>{day.label}일</div>
              </div>;
            })}
          </div>
        </div>
      </motion.section>
      <motion.section {...reveal(0.25)} className="story-today mb-6">
        <div className="story-today__head">
          <div>
            <h2 className="story-today__title">오늘</h2>
            <p className="story-today__sub">
              {todayItems.length
                ? `${todayItems.length}개 · 밀어서 수정·삭제`
                : '아직 기록이 없어요'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="story-today__add story-pressable"
            onClick={() => startAdd(todayIso)}
          >
            기록하기
          </Button>
        </div>

        {todayItems.length ? (
          <ul className="story-today__list">
            {todayItems.map((item) => (
              <motion.li key={item.id} layout initial={reducedMotion ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.27 }} className="story-swipe-item">
                <SwipeRow
                  {...SWIPE_ROW}
                  open={swipeOpenId === `today-${item.id}`}
                  onOpenChange={(open) =>
                    setSwipeOpenId(open ? `today-${item.id}` : null)
                  }
                  label={storyLabel(item)}
                  actions={storySwipeActions(
                    item,
                    () => startEdit(item),
                    () => setDeletingItem(item),
                  )}
                  onCommit={(action) => {
                    if (action.id === 'delete') setDeletingItem(item);
                  }}
                >
                  <button
                    type="button"
                    className="story-today__item story-today__item--button story-today__item--flush"
                    onClick={() => {
                      if (swipeOpenId) {
                        setSwipeOpenId(null);
                        return;
                      }
                      openDay(todayIso);
                    }}
                  >
                    <div className="story-today__icon">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFoodIcon(item.category)}
                        alt=""
                        width={30}
                        height={30}
                        className="h-[30px] w-[30px]"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="story-today__name">{storyLabel(item)}</p>
                      <p className="story-today__meta">
                        {[
                          item.category,
                          item.note.trim() ? item.note.trim() : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </button>
                </SwipeRow>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="story-today__empty">
            <p>오늘 먹은 걸 남겨볼까?</p>
            <Button
              type="button"
              className="story-today__empty-cta"
              onClick={() => startAdd(todayIso)}
            >
              첫 기록 남기기
            </Button>
          </div>
        )}
      </motion.section>

      {panelDepth === 0 ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={openPastList}
            aria-label="지난 기록"
            title="지난 기록"
            className="story-fab story-fab--motion fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+3.5rem)] right-4 z-40 size-12 min-h-12 !rounded-full !p-0"
          >
            <CalendarDays size={20} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => startAdd(todayIso)}
            aria-label="먹은 음식 기록"
            title="먹은 음식 기록"
            className="story-fab story-fab--primary story-fab--motion fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 size-12 min-h-12 !rounded-full !p-0"
          >
            <Plus size={22} strokeWidth={2.25} aria-hidden="true" />
          </Button>
        </>
      ) : null}

      <DepthDrawer open={panelDepth > 0} depth={1} onClose={closeAllPanels}>
        {activePanel === 'past' ? (
          <>
            <DrawerHeader className="story-drawer-head flex-row shrink-0 items-center justify-between gap-3 px-5 py-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] text-left">
              <div className="min-w-0">
                <DrawerTitle className="story-drawer-head__title">
                  지난 기록
                </DrawerTitle>
                <p className="story-drawer-head__sub">
                  {pastGrouped.length
                    ? `최근 ${pastGrouped.length}일`
                    : '아직 지난 기록이 없어'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="story-drawer-head__close size-9 min-h-9 shrink-0 rounded-full !p-0"
                aria-label="전체 닫기"
                title="전체 닫기"
                onClick={closeAllPanels}
              >
                <X size={17} aria-hidden="true" />
              </Button>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
              <div className="mb-3 flex gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#D9D8B8] bg-white px-3"><Search size={16} aria-hidden="true"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="메뉴·메모 검색" aria-label="지난 기록 검색" className="min-h-11 w-full min-w-0 text-sm outline-none"/></label>
                <select aria-label="지난 기록 카테고리" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value as FoodCategory | '전체')} className="rounded-lg border border-[#D9D8B8] bg-white px-2 text-sm"><option value="전체">전체</option>{foodCategories.map(category => <option key={category} value={category}>{category}</option>)}</select>
              </div>
              {visiblePast.length ? (
                <ol className="story-timeline__days">
                  {visiblePast.map(([date, rows], index) => {
                    const heading = formatDayHeading(date);
                    const preview = rows.slice(0, 4);
                    const rest = rows.length - preview.length;
                    return (
                      <li key={date} className="story-timeline__item">
                        <div
                          className="story-timeline__rail"
                          aria-hidden="true"
                        >
                          <span className="story-timeline__dot" />
                          {index < pastGrouped.length - 1 ? (
                            <span className="story-timeline__line" />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="story-timeline__day"
                          onClick={() => openDay(date)}
                          aria-label={`${heading.label} 상세 보기, ${rows.length}개`}
                        >
                          <div className="story-timeline__day-head">
                            <div className="min-w-0">
                              <h3 className="story-timeline__day-label">
                                {heading.label}
                              </h3>
                              {heading.meta ? (
                                <p className="story-timeline__day-meta">
                                  {heading.meta}
                                </p>
                              ) : null}
                            </div>
                            <div className="story-timeline__day-aside">
                              <span className="story-timeline__count">
                                {rows.length}개
                              </span>
                              <ChevronRight
                                size={16}
                                strokeWidth={2}
                                className="story-timeline__chevron"
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <ul className="story-timeline__foods">
                            {preview.map((item) => (
                              <li
                                key={item.id}
                                className="story-timeline__chip"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getFoodIcon(item.category)}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="h-4 w-4 shrink-0"
                                />
                                <span className="min-w-0 truncate">
                                  {storyLabel(item)}
                                </span>
                              </li>
                            ))}
                            {rest > 0 ? (
                              <li className="story-timeline__chip story-timeline__chip--more">
                                +{rest}
                              </li>
                            ) : null}
                          </ul>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="story-empty">
                  <p className="text-[14px] text-[var(--muted)]">
                    지난 기록이 아직 없어.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}

        {activePanel === 'day' && selectedDate && dayHeading ? (
          <>
            <DrawerHeader className="flex-row shrink-0 items-center justify-between gap-3 border-b border-[#e6e1d1] px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-left">
              <div className="min-w-0">
                <DrawerTitle className="text-lg font-bold leading-tight text-[#3f4b32]">
                  {dayHeading.label}
                </DrawerTitle>
                {dayHeading.meta ? (
                  <p className="mt-0.5 text-xs text-[#777765]">{dayHeading.meta}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="size-9 min-h-9 shrink-0 rounded-full !p-0"
                aria-label="전체 닫기"
                title="전체 닫기"
                onClick={closeAllPanels}
              >
                <X size={17} aria-hidden="true" />
              </Button>
            </DrawerHeader>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-3">
                {dayItems.length ? (
                  <div className="story-day__list">
                    {dayItems.map((item) => (
                      <div key={item.id} className="story-swipe-item">
                        <SwipeRow
                          {...SWIPE_ROW}
                          open={swipeOpenId === `day-${item.id}`}
                          onOpenChange={(open) =>
                            setSwipeOpenId(open ? `day-${item.id}` : null)
                          }
                          label={storyLabel(item)}
                          actions={storySwipeActions(
                            item,
                            () => startEdit(item),
                            () => setDeletingItem(item),
                          )}
                          onCommit={(action) => {
                            if (action.id === 'delete') setDeletingItem(item);
                          }}
                        >
                          <article className="story-day__row story-day__row--flush">
                            <div className="story-day__icon">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getFoodIcon(item.category)}
                                alt=""
                                width={28}
                                height={28}
                                className="h-7 w-7"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="story-day__name">
                                {storyLabel(item)}
                              </h3>
                              <p className="story-day__note">
                                {[
                                  item.name.trim() ? item.category : null,
                                  item.note.trim() || null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </div>
                          </article>
                        </SwipeRow>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="story-empty">
                    <p className="text-[14px] text-[var(--muted)]">
                      이 날 기록이 아직 없어.
                    </p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 shrink-0 border-t border-[#e6e1d1] bg-[#f7f5ef]/95 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-4">
                <Button
                  type="button"
                  className="!h-14 !min-h-14 w-full !py-4 text-base !bg-[#66734b] hover:!bg-[#556340]"
                  onClick={() => startAdd(selectedDate ?? undefined)}
                >
                  {selectedIsToday ? '오늘 기록하기' : '이 날 기록하기'}
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {activePanel === 'form' ? (
          <>
            <DrawerHeader className="flex-row shrink-0 items-center justify-between gap-3 border-b border-[#e6e1d1] px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-left">
              <div className="min-w-0">
                <DrawerTitle className="text-lg font-bold leading-tight text-[#3f4b32]">
                  {editing ? '기록 수정' : '새 기록'}
                </DrawerTitle>
                {!editing ? (
                  <p className="mt-0.5 text-xs text-[#777765]">
                    {form.eatenAt === todayIso
                      ? '오늘의 기록'
                      : `${form.eatenAt.replaceAll('-', '.')} · 이 날 기록`}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="size-9 min-h-9 shrink-0 rounded-full !p-0"
                aria-label="전체 닫기"
                title="전체 닫기"
                onClick={closeAllPanels}
              >
                <X size={17} aria-hidden="true" />
              </Button>
            </DrawerHeader>

            <form
              id="story-form"
              onSubmit={submit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2 pt-4">
                <div className="flex justify-center py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFoodIcon(form.category)}
                    alt=""
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px]"
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className={labelClass}>카테고리</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {foodCategories.map((category) => {
                      const active = form.category === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setForm({ ...form, category })}
                          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[13px] font-medium ${
                            active
                              ? 'border-[#4d5b3c] bg-[#4d5b3c] text-[#f7f5ef]'
                              : 'border-[#d9d8b8] bg-white text-[#4d5b3c]'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getFoodIcon(category)}
                            alt=""
                            width={26}
                            height={26}
                            className="h-[26px] w-[26px]"
                          />
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {!editing && quickPicks.length > 0 ? (
                  <div className="space-y-2">
                    <p className={labelClass}>최근 먹은 거</p>
                    <div className="story-quick-picks">
                      {quickPicks.map((pick) => {
                        const label = storyLabel(pick);
                        const active =
                          form.category === normalizeFoodCategory(pick.category) &&
                          form.name.trim() === pick.name.trim();
                        return (
                          <button
                            key={`${pick.category}-${label}`}
                            type="button"
                            className={`story-quick-pick${active ? ' story-quick-pick--active' : ''}`}
                            onClick={() =>
                              setForm({
                                ...form,
                                category: normalizeFoodCategory(pick.category),
                                name: pick.name,
                              })
                            }
                            aria-pressed={active}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getFoodIcon(pick.category)}
                              alt=""
                              width={18}
                              height={18}
                              className="h-[18px] w-[18px] shrink-0"
                            />
                            <span className="min-w-0 truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <label className={labelClass}>
                  날짜
                  <input type="date" value={form.eatenAt} max={todayIso} onChange={(event) => setForm({ ...form, eatenAt: event.target.value })} className={fieldClass} />
                </label>

                <label className={labelClass}>
                  음식 이름
                  <input
                    maxLength={70}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={fieldClass}
                    placeholder="예: 김치찌개, 치킨"
                  />
                </label>

                <label className={labelClass}>
                  메모 (선택)
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className={`${fieldClass} py-3`}
                    placeholder="한 줄 감상"
                  />
                </label>
                {error ? (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="sticky bottom-0 shrink-0 border-t border-[#e6e1d1] bg-[#f7f5ef]/95 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-4">
                <Button
                  type="submit"
                  className="!h-14 !min-h-14 w-full !py-4 text-base !bg-[#66734b] hover:!bg-[#556340]"
                >
                  {editing ? '변경 저장' : '기록하기'}
                </Button>
              </div>
            </form>
          </>
        ) : null}
      </DepthDrawer>

      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기록을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem ? (
                <>
                  <span className="font-semibold text-[#3f4b32]">
                    &apos;{storyLabel(deletingItem)}&apos;
                  </span>
                  <br />
                  삭제하면 되돌릴 수 없어요.
                </>
              ) : (
                '삭제하면 되돌릴 수 없어요.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingItem(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingItem) {
                  confirmDelete(deletingItem);
                  setDeletingItem(null);
                }
              }}
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
