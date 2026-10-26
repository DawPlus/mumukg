'use client';

import { useMemo, useState } from 'react';
import {
  foodIconGroups,
  foodIconOptions,
  foodIconPath,
} from '@/lib/food-icons';

type Props = {
  value: string;
  onChange: (code: string) => void;
};

export function FoodIconPicker({ value, onChange }: Props) {
  const [group, setGroup] = useState<string>('전체');

  const visible = useMemo(() => {
    if (group === '전체') return foodIconOptions;
    return foodIconOptions.filter((item) => item.group === group);
  }, [group]);

  const selected = foodIconOptions.find((item) => item.code === value);

  return (
    <fieldset className="min-w-0 w-full max-w-full space-y-3">
      <legend className="text-[13px] font-medium text-[var(--text)]">아이콘</legend>
      <div className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-3 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foodIconPath(value || '1f37d')}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">
            {selected?.label ?? '선택'}
          </p>
          <p className="truncate text-[12px] text-[var(--muted)]">
            아래에서 아이콘을 고를 수 있어.
          </p>
        </div>
      </div>

      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain touch-pan-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max flex-nowrap gap-1.5">
          {['전체', ...foodIconGroups].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setGroup(name)}
              aria-pressed={group === name}
              className={`h-8 shrink-0 whitespace-nowrap rounded-[var(--radius-control)] px-2.5 text-[12px] ${
                group === name
                  ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                  : 'bg-[var(--surface)] text-[var(--text)]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div
        role="listbox"
        aria-label="음식 아이콘 선택"
        className="grid max-h-48 grid-cols-4 gap-1 overflow-y-auto overscroll-contain rounded-[var(--radius-card)] bg-[var(--surface)] p-1.5 sm:grid-cols-5"
      >
        {visible.map((item) => {
          const active = value === item.code;
          return (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={active}
              title={item.label}
              onClick={() => onChange(item.code)}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[14px] px-0.5 py-1.5 text-[9px] leading-tight ${
                active
                  ? 'bg-[var(--raised)] font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foodIconPath(item.code)}
                alt=""
                width={26}
                height={26}
                className="h-[26px] w-[26px] shrink-0"
              />
              <span className="line-clamp-1 w-full min-w-0 px-0.5 text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
