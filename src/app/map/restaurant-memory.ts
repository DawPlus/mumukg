import type { MapImportItem, MapMemory, MapVisit as SharedMapVisit, Restaurant } from '../../lib/types';

export type Revisit = 'yes' | 'maybe' | 'no';
export type MapVisit = SharedMapVisit & { date: string; menu: string; reason: string };
export type MapRestaurant = Restaurant & {
  isFavorite?: boolean;
  memory?: string;
  nextMenu?: string;
  tags?: string[];
  visits?: MapVisit[];
  contributors?: MapMemory[];
  createdBy?: string;
  creatorNickname?: string;
};

export function normalizeLegacyMapItem(item: MapRestaurant): MapImportItem {
  const visits = getVisits(item).map(visit => ({
    ...visit,
    sourceId: `${item.id}:${visit.id}`,
  }));
  const { memory, nextMenu, tags, ...place } = item;
  delete place.visits;
  delete place.contributors;
  delete place.createdBy;
  delete place.creatorNickname;
  return {
    place: {
      ...place,
      kakaoPlaceId: item.placeId ?? item.kakaoPlace?.id,
      note: '',
    },
    memory: {
      memory: [memory, item.note].filter(value => value?.trim()).join('\n'),
      nextMenu,
      tags: [...(tags ?? [])],
      visited: visits.length > 0,
      isFavorite: isFavorite(item),
      visits,
    },
    visits,
  };
}
export type RestaurantFilter = 'all' | 'wish' | 'revisit' | 'recent';
export const revisitLabels: Record<Revisit, string> = { yes: '다시 갈래', maybe: '고민 중', no: '안 갈래' };
export const memoryTags = ['혼밥 좋음', '가성비', '조용함', '시끄러움', '대기 김', '주차 편함'];
export const visitHighlights = [
  { label: '맛있음', sentence: '음식이 맛있었어요.' },
  { label: '양 넉넉', sentence: '양이 넉넉했어요.' },
  { label: '가성비', sentence: '가성비가 좋았어요.' },
  { label: '친절', sentence: '친절했어요.' },
  { label: '혼밥', sentence: '혼밥하기 좋았어요.' },
  { label: '조용함', sentence: '분위기가 조용했어요.' },
  { label: '대기 김', sentence: '대기가 길었어요.' },
  { label: '주차 편함', sentence: '주차하기 편했어요.' },
];

export function composeVisitPost(visit: MapVisit) {
  return [
    visit.date ? `${visit.date.replaceAll('-', '.')}에 다녀왔어요.` : '',
    visit.revisit === 'yes' ? '다시 가고 싶어요.' : visit.revisit === 'no' ? '다시 가진 않을래요.' : visit.revisit === 'maybe' ? '한 번 더 생각해 볼래요.' : '',
    visit.stars ? `${visit.stars}점으로 기억할게요.` : '',
    ...(visit.highlights ?? []).flatMap(tag => {
      const highlight = visitHighlights.find(option => option.label === tag);
      return highlight ? [highlight.sentence] : [];
    }),
    visit.menu.trim() ? `${visit.menu.trim()}를 먹었어요.` : '',
    visit.reason.trim(),
  ].filter(Boolean).join(' ');
}

export function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validVisitDate(value: string, today = todayLocal()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getVisits(item: MapRestaurant): MapVisit[] {
  let visits = item.visits;
  if (!visits) {
    // Old saves did not store the date of their initial rating or a revisit intention.
    visits = item.rating || item.satisfaction
      ? [{ id: 'legacy-initial', date: '', stars: item.rating, legacySatisfaction: item.satisfaction, menu: '', reason: '' }]
      : [];
    const dates = [...(item.visitDates ?? [])];
    for (const [index, feedback] of (item.visitFeedback ?? []).entries()) {
      visits.push({ id: `legacy-feedback-${index}`, date: feedback.date, legacySatisfaction: feedback.rating, reason: feedback.reason, menu: '' });
      const match = dates.indexOf(feedback.date);
      if (match !== -1) dates.splice(match, 1);
    }
    visits.push(...dates.map((date, index) => ({ id: `legacy-date-${index}`, date, menu: '', reason: '' })));
    if (!visits.length && item.visited) visits.push({ id: 'legacy-visited', date: '', menu: '', reason: '' });
  }
  return [...visits].reverse().sort((a, b) => b.date.localeCompare(a.date));
}

export function withVisits(item: MapRestaurant, visits: MapVisit[]): MapRestaurant {
  const latest = getVisits({ ...item, visits })[0];
  return {
    ...item, isFavorite: isFavorite(item), visits, visited: visits.length > 0,
    rating: latest?.stars, satisfaction: latest?.legacySatisfaction,
    visitDates: visits.flatMap(v => v.date ? [v.date] : []),
    visitFeedback: visits.flatMap(v => v.legacySatisfaction ? [{ date: v.date, rating: v.legacySatisfaction, reason: v.reason }] : []),
  };
}

export function projectMemberMemory(item: MapRestaurant, userId: string | null): MapRestaurant {
  const own = item.contributors?.find(memory => memory.userId === userId);
  if (!own) return withVisits({ ...item, isFavorite: false, memory: '', nextMenu: undefined, tags: [], rating: undefined, satisfaction: undefined }, []);
  return withVisits({ ...item, isFavorite: own.isFavorite ?? !own.visited, memory: own.memory, nextMenu: own.nextMenu, tags: own.tags }, own.visits);
}

export function isFavorite(item: MapRestaurant): boolean {
  // Old unvisited saves were the wishlist, before hearts existed.
  return item.isFavorite ?? getVisits(item).length === 0;
}

export function getRestaurantMarker(item: MapRestaurant): 'heart' | 'visited' | 'memo' | null {
  if (isFavorite(item)) return 'heart';
  if (getVisits(item).length) return 'visited';
  if ([item.memory, item.nextMenu, item.note].some(value => value?.trim()) || item.tags?.length) return 'memo';
  // Clearing my heart must not hide another member's shared records.
  if (item.contributors?.some(memory => memory.visits.length)) return 'visited';
  if (item.contributors?.some(memory => memory.isFavorite || memory.memory.trim() || memory.nextMenu?.trim() || memory.tags.length)) return 'memo';
  return null;
}

export function getOtherMemberMemories(item: MapRestaurant, userId: string | null) {
  return (item.contributors ?? []).filter(memory => memory.userId !== userId);
}

export function findRestaurants(items: MapRestaurant[], query: string, filter: RestaurantFilter): MapRestaurant[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter(item => {
    if (!getRestaurantMarker(item)) return false;
    const visits = getVisits(item);
    if (filter === 'wish' && !isFavorite(item)) return false;
    if (filter === 'revisit' && visits[0]?.revisit !== 'yes') return false;
    if (filter === 'recent' && !visits[0]?.date) return false;
    const text = [item.name, item.category, item.address, item.memory, item.note, item.nextMenu, ...(item.tags ?? []), ...visits.flatMap(v => [v.menu, v.reason, ...(v.highlights ?? [])])].join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
  return filter === 'recent'
    ? matches.sort((a, b) => getVisits(b)[0].date.localeCompare(getVisits(a)[0].date))
    : matches;
}
