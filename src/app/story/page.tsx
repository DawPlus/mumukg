'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Shell } from '@/components/shell';
import { StoryRankCloud } from '@/components/story-rank-cloud';
import { DepthDrawer } from '@/components/ui/depth-drawer';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  foodCategories,
  getCategoryIconCode,
  getFoodIcon,
  normalizeFoodCategory,
  type FoodCategory,
} from '@/lib/food-categories';
import {
  formatWon,
  loadStories,
  saveStories,
  storyLabel,
} from '@/lib/story';
import type { FoodStory } from '@/lib/types';
import './story.css';

type Panel = 'past' | 'day' | 'form';

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
  const [items, setItems] = useState<FoodStory[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [panelStack, setPanelStack] = useState<Panel[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState('');

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

  function startAdd(_date?: string) {
    const eatenAt = today();
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
    const eatenAt = editing ? form.eatenAt.trim() : today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eatenAt)) {
      setError('날짜를 확인할 수 없어요.');
      return;
    }
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
                icon: payload.icon,
                // keep legacy place/rating/amount on edit; clear only if we want full simplify
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
      setSelectedDate(eatenAt);
      setEditing(null);
      setError('');
      setPanelStack((stack) =>
        stack.includes('past') ? ['past', 'day'] : ['day'],
      );
    }
  }

  function remove(item: FoodStory) {
    if (window.confirm(`'${storyLabel(item)}' 기록을 삭제할까?`)) {
      const next = items.filter((x) => x.id !== item.id);
      persist(next);
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

  return (
    <Shell tone="editorial">
      <StoryRankCloud items={items} />

      <section className="story-today mb-8">
        <div className="story-today__head">
          <div>
            <p className="story-today__eyebrow">오늘의 메뉴</p>
            <h2 className="story-today__title">오늘</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            className="!h-9 !min-h-9 shrink-0 !rounded-full !border-[#d9d8b8] !bg-[#f7f5ef] !px-3.5 text-[13px] font-semibold !text-[#4d5b3c] hover:!bg-[#efe6d4]"
            onClick={() => startAdd(todayIso)}
          >
            기록하기
          </Button>
        </div>

        {todayItems.length ? (
          <>
            <ul className="story-today__list">
              {todayItems.map((item) => (
                <li key={item.id} className="story-today__item">
                  <div className="story-today__icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFoodIcon(item.category)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="story-today__name">{storyLabel(item)}</p>
                    <p className="story-today__meta">
                      {[item.category, item.place, item.rating != null ? `${item.rating}점` : '']
                        .filter(Boolean)
                        .join(' · ') || '기록됨'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-3 !h-12 !min-h-12 w-full !bg-[#66734b] text-[15px] font-medium hover:!bg-[#556340]"
              onClick={() => openDay(todayIso)}
            >
              오늘 상세 보기
            </Button>
          </>
        ) : (
          <div className="story-today__empty">
            <p>아직 오늘 먹은 기록이 없어.</p>
            <Button
              type="button"
              className="mt-3 !h-12 !min-h-12 w-full !bg-[#66734b] text-[15px] font-medium hover:!bg-[#556340]"
              onClick={() => startAdd(todayIso)}
            >
              오늘 먹은 거 기록하기
            </Button>
          </div>
        )}
      </section>

      {panelDepth === 0 ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={openPastList}
            aria-label="지난 기록"
            title="지난 기록"
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+3.5rem)] right-4 z-40 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-xl shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]"
          >
            <span aria-hidden="true">📋</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => startAdd(todayIso)}
            aria-label="먹은 음식 기록"
            title="먹은 음식 기록"
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 size-12 min-h-12 !rounded-full !border border-[#d9d8b8] !bg-[#f7f5ef] !p-0 text-xl shadow-lg shadow-[#38432f]/20 hover:!bg-[#efe6d4]"
          >
            <span aria-hidden="true">🐷</span>
          </Button>
        </>
      ) : null}

      <DepthDrawer open={panelDepth > 0} depth={panelDepth} onClose={closeAllPanels}>
        {activePanel === 'past' ? (
          <>
            <DrawerHeader className="flex-row shrink-0 items-center justify-between gap-3 border-b border-[#e6e1d1] px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-left">
              <div className="min-w-0">
                <DrawerTitle className="text-lg font-bold leading-tight text-[#3f4b32]">
                  지난 기록
                </DrawerTitle>
                <p className="mt-0.5 text-xs text-[#777765]">
                  {pastGrouped.length
                    ? `${pastGrouped.length}일 · 눌러서 자세히`
                    : '아직 지난 기록이 없어'}
                </p>
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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              {pastGrouped.length ? (
                <div className="story-timeline__days">
                  {pastGrouped.map(([date, rows]) => {
                    const heading = formatDayHeading(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        className="story-timeline__day"
                        onClick={() => openDay(date)}
                        aria-label={`${heading.label} 상세 보기`}
                      >
                        <div className="story-timeline__day-head">
                          <div>
                            <h3 className="story-timeline__day-label">
                              {heading.label}
                            </h3>
                            {heading.meta ? (
                              <p className="story-timeline__day-meta">
                                {heading.meta}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="story-timeline__foods">
                          {rows.map((item) => (
                            <div key={item.id} className="story-timeline__food">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getFoodIcon(item.category)}
                                alt=""
                                width={22}
                                height={22}
                                className="h-[22px] w-[22px] shrink-0"
                              />
                              <span className="min-w-0 truncate">
                                {storyLabel(item)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                      <article key={item.id} className="story-day__row">
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
                          <h3 className="text-[16px] font-medium leading-snug tracking-tight text-[var(--ink)]">
                            {storyLabel(item)}
                          </h3>
                          <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                            {[
                              item.name.trim() ? item.category : null,
                              item.place || null,
                              item.amount != null ? formatWon(item.amount) : null,
                              item.rating != null ? `${item.rating}점` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </p>
                          {item.note ? (
                            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--text)]">
                              {item.note}
                            </p>
                          ) : null}
                          <div className="story-day__actions">
                            <button
                              type="button"
                              className="story-day__action"
                              onClick={() => startEdit(item)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className="story-day__action story-day__action--danger"
                              onClick={() => remove(item)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </article>
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
                  onClick={() => startAdd()}
                >
                  오늘 기록하기
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
                  <p className="mt-0.5 text-xs text-[#777765]">오늘 · 날짜 고정</p>
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

                <label className={labelClass}>
                  세부 이름 (선택)
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
    </Shell>
  );
}
