'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { FoodIconPicker } from '@/components/food-icon-picker';
import { Shell } from '@/components/shell';
import { StoryRankCloud } from '@/components/story-rank-cloud';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  formatWon,
  loadStories,
  resolveFoodIconSrc,
  saveStories,
  suggestIconCode,
} from '@/lib/story';
import type { FoodStory } from '@/lib/types';
import './story.css';

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(value: string) {
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${y}.${m}.${d}`;
}

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-[14px] border border-[var(--border)] bg-[var(--raised)] px-3 text-[15px] text-[var(--text)] outline-none focus:border-[var(--control)]';
const labelClass = 'block text-[13px] font-medium text-[var(--text)]';

const initialForm = {
  name: '',
  eatenAt: '',
  place: '',
  note: '',
  rating: '' as string,
  amount: '' as string,
  icon: '1f37d',
};

export default function StoryPage() {
  const [items, setItems] = useState<FoodStory[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [iconTouched, setIconTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  function startAdd() {
    setForm({ ...initialForm, eatenAt: today() });
    setIconTouched(false);
    setEditing(null);
    setOpen(true);
    setError('');
  }

  function startEdit(item: FoodStory) {
    setForm({
      name: item.name,
      eatenAt: item.eatenAt,
      place: item.place,
      note: item.note,
      rating: item.rating == null ? '' : String(item.rating),
      amount: item.amount == null ? '' : String(item.amount),
      icon: item.icon || suggestIconCode(item.name),
    });
    setIconTouched(true);
    setEditing(item.id);
    setOpen(true);
    setError('');
  }

  function onNameChange(name: string) {
    if (iconTouched) {
      setForm({ ...form, name });
      return;
    }
    setForm({
      ...form,
      name,
      icon: name.trim() ? suggestIconCode(name) : '1f37d',
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = form.name.trim();
    const eatenAt = form.eatenAt.trim();
    if (!name) {
      setError('음식 이름을 입력해 줘.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eatenAt)) {
      setError('먹은 날짜를 선택해 줘.');
      return;
    }
    let rating: number | null = null;
    if (form.rating.trim()) {
      const n = Number(form.rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        setError('별점은 1~5 사이 숫자로 입력해 줘.');
        return;
      }
      rating = n;
    }
    let amount: number | null = null;
    if (form.amount.trim()) {
      const n = Number(form.amount.replace(/,/g, ''));
      if (!Number.isFinite(n) || n < 0 || n > 10_000_000) {
        setError('금액은 0원 이상, 1천만원 이하로 입력해 줘.');
        return;
      }
      amount = Math.round(n);
    }
    const icon = form.icon || suggestIconCode(name);
    const payload = {
      name,
      eatenAt,
      place: form.place.trim(),
      note: form.note.trim(),
      rating,
      amount,
      icon,
    };
    const next = editing
      ? items.map((item) => (item.id === editing ? { ...item, ...payload } : item))
      : [
          {
            id: crypto.randomUUID(),
            ...payload,
            createdAt: new Date().toISOString(),
          },
          ...items,
        ];
    if (persist(next)) {
      setOpen(false);
      setEditing(null);
      setIconTouched(false);
      setError('');
    }
  }

  function remove(item: FoodStory) {
    if (window.confirm(`'${item.name}' 기록을 삭제할까?`)) {
      persist(items.filter((x) => x.id !== item.id));
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.name, item.place, item.note].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FoodStory[]>();
    for (const item of visible) {
      const list = map.get(item.eatenAt) ?? [];
      list.push(item);
      map.set(item.eatenAt, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <Shell tone="editorial">
      <StoryRankCloud items={items} />

      {!open ? (
        <button
          type="button"
          onClick={startAdd}
          aria-label="먹은 음식 기록"
          className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9d8b8] bg-[#4d5b3c] text-[#efe6d4] shadow-[0_8px_24px_rgba(77,91,60,0.35)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
        >
          <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}

      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError('');
        }}
      >
        <DrawerContent className="story-drawer max-h-[92dvh] rounded-t-[28px] border-[#d9d8b8]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle>{editing ? '기록 수정' : '새 기록'}</DrawerTitle>
              <DrawerClose className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)]">
                닫기
              </DrawerClose>
            </div>
          </DrawerHeader>

          <form
            id="story-form"
            onSubmit={submit}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2"
          >
            <label className={labelClass}>
              음식 이름
              <input
                required
                maxLength={70}
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                className={fieldClass}
                placeholder="예: 김치찌개, 치킨"
              />
            </label>

            <FoodIconPicker
              value={form.icon}
              onChange={(code) => {
                setIconTouched(true);
                setForm({ ...form, icon: code });
              }}
            />

            <label className={labelClass}>
              날짜
              <input
                required
                type="date"
                value={form.eatenAt}
                onChange={(e) => setForm({ ...form, eatenAt: e.target.value })}
                className={fieldClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                금액 (선택)
                <input
                  inputMode="numeric"
                  type="number"
                  min={0}
                  max={10000000}
                  step={100}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={`${fieldClass} num`}
                  placeholder="예: 9000"
                />
              </label>
              <label className={labelClass}>
                별점 (선택)
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className={fieldClass}
                  aria-label="별점"
                >
                  <option value="">없음</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}점
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              장소 (선택)
              <input
                maxLength={70}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                className={fieldClass}
                placeholder="집, 회사, 식당 이름"
              />
            </label>
            <label className={labelClass}>
              메모
              <textarea
                rows={2}
                maxLength={300}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className={`${fieldClass} py-3`}
                placeholder="맛, 같이 먹은 사람, 한 줄 감상"
              />
            </label>
            {error ? (
              <p
                role="alert"
                className="text-[13px] text-[var(--negative,#b42318)]"
              >
                {error}
              </p>
            ) : null}
          </form>

          <DrawerFooter className="pb-[calc(16px+env(safe-area-inset-bottom))]">
            <Button
              type="submit"
              form="story-form"
              className="h-12 w-full rounded-[var(--radius-control)] bg-[var(--primary)] text-[15px] font-medium text-[var(--on-primary)] hover:bg-[var(--primary)]/90"
            >
              {editing ? '변경 저장' : '기록하기'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="mb-6 max-w-xl">
        <input
          aria-label="먹스토리 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="음식, 장소, 메모 검색"
          className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[#fffaf0] px-4 text-[15px] text-[var(--text)] shadow-sm outline-none focus:border-[var(--ink)]"
        />
      </div>

      {grouped.length ? (
        <div className="space-y-9">
          {grouped.map(([date, rows]) => (
            <section key={date}>
              <h2 className="mb-3 border-b border-[var(--border)] pb-2 text-[13px] font-semibold tracking-wide text-[var(--muted)]">
                {formatDate(date)}
              </h2>
              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[var(--radius-card)] border border-[#d4d4b7] bg-[#f7f1e3] p-4 shadow-[0_3px_12px_rgba(77,91,60,0.05)] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveFoodIconSrc(item.name, item.icon)}
                        alt=""
                        width={36}
                        height={36}
                        className="mt-0.5 h-11 w-11 shrink-0 rounded-xl bg-[#efe6d4] p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-[var(--ink)]">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-[13px] text-[var(--muted)]">
                          {item.place ? `${item.place}` : null}
                          {item.place && item.amount != null ? ' · ' : null}
                          {item.amount != null ? (
                            <span className="num text-[var(--accent)]">
                              {formatWon(item.amount)}
                            </span>
                          ) : null}
                          {(item.place || item.amount != null) &&
                          item.rating != null
                            ? ' · '
                            : null}
                          {item.rating != null ? `${item.rating}점` : null}
                          {!item.place &&
                          item.amount == null &&
                          item.rating == null
                            ? '메모 없음'
                            : null}
                        </p>
                        {item.note ? (
                          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text)]">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-[var(--border)] pt-3">
                      <button
                        type="button"
                        className="h-10 flex-1 rounded-[var(--radius-control)] bg-[var(--raised)] text-[13px] font-medium text-[var(--text)] ring-1 ring-[var(--border)]"
                        onClick={() => startEdit(item)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="h-10 flex-1 rounded-[var(--radius-control)] text-[13px] font-medium text-[var(--negative,#b42318)] ring-1 ring-[var(--border)]"
                        onClick={() => remove(item)}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[#f7f1e3] px-5 py-10 text-center">
          <p className="text-[14px] text-[var(--muted)]">
            {items.length
              ? '검색 조건에 맞는 기록이 없어.'
              : '아직 기록된 음식이 없어.'}
          </p>
          <button
            type="button"
            className="mt-3 h-10 text-[14px] font-medium text-[var(--accent)]"
            onClick={startAdd}
          >
            첫 기록 남기기
          </button>
        </div>
      )}
    </Shell>
  );
}
