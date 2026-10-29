import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisits, withVisits, findRestaurants, validVisitDate, normalizeLegacyMapItem, projectMemberMemory, getOtherMemberMemories } from './restaurant-memory.ts';

const restaurant = { id: 'place', name: '들깨집', category: '한식', latitude: 37.5, longitude: 126.9, note: '골목 안쪽', visited: false, createdAt: '2026-10-01' };
const visit = (id, date, revisit = 'yes') => ({ id, date, revisit, stars: 4, menu: '들깨칼국수', reason: '' });

test('legacy feedback and duplicate dates retain one visit per actual entry, without inventing revisit intent', () => {
  const visits = getVisits({ ...restaurant, rating: 4, satisfaction: 'satisfied', visitDates: ['2026-10-02', '2026-10-02'], visitFeedback: [{ date: '2026-10-02', rating: 'unsatisfied', reason: '짰음' }] });
  assert.equal(visits.length, 3);
  assert.equal(visits.filter(v => v.date === '2026-10-02').length, 2);
  assert.equal(visits.find(v => v.stars === 4).date, '');
  assert.equal(visits[0].revisit, undefined);
  assert.ok(visits.some(v => v.reason === '짰음'));
});

test('newest visit is chosen by visit date, not creation order; same-day records use last entry', () => {
  const saved = withVisits(restaurant, [visit('recent', '2026-10-20', 'no'), visit('old', '2026-10-02'), visit('latest', '2026-10-20', 'maybe')]);
  assert.equal(getVisits(saved)[0].id, 'latest');
  assert.equal(saved.visited, true);
  assert.equal(saved.visitDates.length, 3);
  assert.equal(findRestaurants([saved], '', 'revisit').length, 0);
});

test('editing and removing a same-day entry preserves its sibling and updates latest intent', () => {
  const first = visit('first', '2026-10-20');
  const second = visit('second', '2026-10-20', 'no');
  const edited = withVisits(restaurant, [first, { ...second, date: '2026-10-01' }]);
  assert.equal(getVisits(edited)[0].id, 'first');
  const removed = withVisits(edited, edited.visits.filter(v => v.id !== 'first'));
  assert.equal(getVisits(removed)[0].id, 'second');
  const empty = withVisits(removed, []);
  assert.equal(empty.visited, false);
  assert.deepEqual(getVisits(empty), []);
  assert.deepEqual(empty.visitDates, []);
});

test('empty new visit history does not resurrect old ratings on reload', () => {
  const saved = withVisits({ ...restaurant, rating: 5, satisfaction: 'satisfied' }, []);
  assert.deepEqual(getVisits(JSON.parse(JSON.stringify(saved))), []);
  assert.equal(findRestaurants([saved], '', 'wish').length, 0);
});

test('search combines menu, memory, tags and notes; recent filter sorts dated visits only', () => {
  const older = withVisits({ ...restaurant, id: 'older', memory: '점심 피하기', tags: ['혼밥 좋음'], nextMenu: '수육' }, [visit('a', '2026-10-01')]);
  const newer = withVisits({ ...restaurant, id: 'newer' }, [visit('b', '2026-10-20')]);
  assert.equal(findRestaurants([older, newer], '수육 혼밥', 'all')[0].id, 'older');
  assert.equal(findRestaurants([older, newer], '칼국수', 'all').length, 2);
  assert.deepEqual(findRestaurants([older, restaurant, newer], '', 'recent').map(x => x.id), ['newer', 'older']);
  assert.equal(findRestaurants([older, restaurant], '', 'wish').length, 2);
});

test('visit date rejects impossible and future dates but accepts leap day', () => {
  assert.equal(validVisitDate('2026-02-30', '2026-10-28'), false);
  assert.equal(validVisitDate('2026-10-29', '2026-10-28'), false);
  assert.equal(validVisitDate('2024-02-29', '2026-10-28'), true);
  assert.equal(validVisitDate('', '2026-10-28'), false);
});

test('legacy import preserves ratings, satisfaction, tags and duplicate dated visits with stable source IDs', () => {
  const legacy = {
    ...restaurant,
    id: 'local:one',
    placeId: 'kakao-123',
    rating: 4,
    satisfaction: 'satisfied',
    note: '점심엔 대기가 길어요',
    tags: ['혼밥 좋음'],
    visits: [visit('visit-a', '2026-10-20'), visit('visit-b', '2026-10-20', 'no')],
  };
  const first = normalizeLegacyMapItem(legacy);
  const second = normalizeLegacyMapItem(legacy);

  assert.equal(first.place.kakaoPlaceId, 'kakao-123');
  assert.equal(first.memory.memory, '점심엔 대기가 길어요');
  assert.equal(first.place.note, '');
  assert.deepEqual(first.memory.tags, ['혼밥 좋음']);
  assert.equal(first.visits.length, 2);
  assert.deepEqual(first.visits.map(item => item.sourceId), second.visits.map(item => item.sourceId));
  assert.equal(new Set(first.visits.map(item => item.sourceId)).size, 2);
  assert.equal(first.visits[0].date, first.visits[1].date);
});

test('legacy Kakao identity can come from the saved place payload alone', () => {
  const legacy = { ...restaurant, id: 'local:kakao-only', kakaoPlace: { id: 'kakao-456' } };
  assert.equal(normalizeLegacyMapItem(legacy).place.kakaoPlaceId, 'kakao-456');
});

test('one shared place projects only the current member into filters and keeps others grouped by author', () => {
  const shared = {
    ...restaurant,
    contributors: [
      { id: 'memory-a', placeId: 'place', userId: 'user-a', nickname: '민지', memory: '조용함', tags: ['혼밥 좋음'], visited: true, createdAt: '', updatedAt: '', visits: [visit('a1', '2026-10-20')] },
      { id: 'memory-b', placeId: 'place', userId: 'user-b', nickname: '도윤', memory: '점심 대기 김', tags: ['대기 김'], visited: false, createdAt: '', updatedAt: '', visits: [] },
    ],
  };
  const mine = projectMemberMemory(shared, 'user-a');
  assert.equal(findRestaurants([mine], '조용함', 'all').length, 1);
  assert.equal(findRestaurants([mine], '대기 김', 'all').length, 0);
  assert.equal(getOtherMemberMemories(mine, 'user-a')[0].nickname, '도윤');
  assert.equal(findRestaurants([mine], '', 'all').length, 1);
});

test('favorite marker takes priority; removing heart preserves visits and notes', async () => {
  const { getRestaurantMarker, isFavorite } = await import('./restaurant-memory.ts');
  const saved = { ...restaurant, isFavorite: true, visits: [visit('v', '2026-10-20')] };
  assert.equal(getRestaurantMarker(saved), 'heart');
  assert.equal(getRestaurantMarker({ ...saved, isFavorite: false }), 'visited');
  assert.equal(getRestaurantMarker({ ...restaurant, isFavorite: false, visits: [] }), 'memo');
  assert.equal(getRestaurantMarker({ ...restaurant, note: '', isFavorite: false, visits: [] }), null);
  assert.equal(isFavorite({ ...restaurant, note: '', visited: false }), true);
  assert.equal(isFavorite(saved), true);
  assert.equal(findRestaurants([{ ...saved, isFavorite: false }], '', 'wish').length, 0);
  assert.equal(findRestaurants([saved], '', 'wish').length, 1);
});

test('heart projection and import keep each member independent', () => {
  const contributors = [
    { userId: 'a', memory: '', tags: [], visited: true, isFavorite: true, visits: [visit('v', '2026-10-20')] },
    { userId: 'b', memory: '메모', tags: [], visited: false, isFavorite: false, visits: [] },
  ];
  const place = { ...restaurant, note: '', contributors };
  assert.equal(projectMemberMemory(place, 'a').isFavorite, true);
  assert.equal(projectMemberMemory(place, 'b').isFavorite, false);
  assert.equal(projectMemberMemory(place, 'c').isFavorite, false);
  assert.equal(normalizeLegacyMapItem({ ...restaurant, isFavorite: false }).memory.isFavorite, false);
});

test('another member shared record remains visible after my empty heart is cleared', async () => {
  const { getRestaurantMarker } = await import('./restaurant-memory.ts');
  const place = { ...restaurant, note: '', isFavorite: false, visits: [], contributors: [{ userId: 'other', memory: '공유 기억', tags: [], visits: [] }] };
  assert.equal(getRestaurantMarker(place), 'memo');
  assert.equal(findRestaurants([place], '', 'all').length, 1);
  assert.equal(findRestaurants([place], '', 'wish').length, 0);
});

test('adding a visit to an old wishlist preserves its heart; deleting visits does not create one', () => {
  assert.equal(withVisits({ ...restaurant, visited: false }, [visit('v', '2026-10-20')]).isFavorite, true);
  assert.equal(withVisits({ ...restaurant, visited: true }, []).isFavorite, false);
});
