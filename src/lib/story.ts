import {
  getCategoryIconCode,
  normalizeFoodCategory,
} from './food-categories';
import { suggestIconCode } from './food-icons';
import type { CategoryRank, FoodRank, FoodStory } from './types';

const STORAGE_KEY = 'mumukg.story.v1';

export function storyLabel(item: Pick<FoodStory, 'name' | 'category'>) {
  const name = item.name.trim();
  return name || item.category || '기타';
}

function normalizeStory(item: unknown): FoodStory | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Partial<FoodStory> & { mealType?: unknown };
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.eatenAt !== 'string' ||
    typeof row.place !== 'string' ||
    typeof row.note !== 'string' ||
    typeof row.createdAt !== 'string'
  ) {
    return null;
  }
  if (
    !(
      row.rating === null ||
      row.rating === undefined ||
      (typeof row.rating === 'number' && row.rating >= 1 && row.rating <= 5)
    )
  ) {
    return null;
  }
  if (
    !(
      row.amount === null ||
      row.amount === undefined ||
      (typeof row.amount === 'number' && Number.isFinite(row.amount) && row.amount >= 0)
    )
  ) {
    return null;
  }
  const category = normalizeFoodCategory(row.category);
  const icon =
    typeof row.icon === 'string' && row.icon.trim()
      ? row.icon.trim()
      : getCategoryIconCode(category) || suggestIconCode(row.name);
  return {
    id: row.id,
    name: row.name,
    category,
    eatenAt: row.eatenAt,
    place: row.place,
    note: row.note,
    rating: row.rating ?? null,
    amount: row.amount == null ? null : Math.round(row.amount),
    icon,
    createdAt: row.createdAt,
  };
}

export function loadStories(): FoodStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeStory)
      .filter((item): item is FoodStory => item !== null)
      .sort((a, b) => {
        if (a.eatenAt === b.eatenAt) return b.createdAt.localeCompare(a.createdAt);
        return b.eatenAt.localeCompare(a.eatenAt);
      });
  } catch {
    return [];
  }
}

export function saveStories(items: FoodStory[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function rankRecentFoods(items: FoodStory[], days = 7): FoodRank[] {
  const since = daysAgoIso(days - 1);
  type Acc = FoodRank & { iconVotes: Map<string, number> };
  const map = new Map<string, Acc>();
  for (const item of items) {
    if (item.eatenAt < since) continue;
    const key = storyLabel(item);
    const icon =
      item.icon || getCategoryIconCode(item.category) || suggestIconCode(key);
    const current =
      map.get(key) ??
      ({
        name: key,
        count: 0,
        totalAmount: 0,
        icon,
        iconVotes: new Map<string, number>(),
      } satisfies Acc);
    current.count += 1;
    if (item.amount != null) current.totalAmount += item.amount;
    current.iconVotes.set(icon, (current.iconVotes.get(icon) ?? 0) + 1);
    map.set(key, current);
  }
  return [...map.values()]
    .map(({ iconVotes, ...rank }) => {
      let bestIcon = rank.icon;
      let bestVotes = -1;
      for (const [code, votes] of iconVotes) {
        if (votes > bestVotes) {
          bestVotes = votes;
          bestIcon = code;
        }
      }
      return { ...rank, icon: bestIcon };
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount;
      return a.name.localeCompare(b.name, 'ko');
    });
}

export function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

/** Category frequency in the recent window, most eaten first. */
export function rankRecentCategories(
  items: FoodStory[],
  days = 7,
): CategoryRank[] {
  const since = daysAgoIso(days - 1);
  const map = new Map<string, CategoryRank>();
  for (const item of items) {
    if (item.eatenAt < since) continue;
    const category = normalizeFoodCategory(item.category);
    const current =
      map.get(category) ??
      ({
        category,
        count: 0,
        icon: getCategoryIconCode(category),
      } satisfies CategoryRank);
    current.count += 1;
    map.set(category, current);
  }
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.category.localeCompare(b.category, 'ko');
  });
}

/** Distinct recent foods for quick re-entry, newest first. */
export function recentFoodPicks(
  items: FoodStory[],
  limit = 8,
): Array<Pick<FoodStory, 'name' | 'category' | 'icon'>> {
  const seen = new Set<string>();
  const picks: Array<Pick<FoodStory, 'name' | 'category' | 'icon'>> = [];
  for (const item of items) {
    const key = storyLabel(item);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push({
      name: item.name.trim() ? item.name.trim() : '',
      category: item.category,
      icon:
        item.icon ||
        getCategoryIconCode(item.category) ||
        suggestIconCode(key),
    });
    if (picks.length >= limit) break;
  }
  return picks;
}

export {
  foodEmoji,
  foodIconGroups,
  foodIconOptions,
  foodIconPath,
  foodIconSrc,
  resolveFoodIconSrc,
  suggestIconCode,
} from './food-icons';
