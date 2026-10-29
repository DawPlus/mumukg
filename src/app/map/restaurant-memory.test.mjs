import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisits, withVisits, findRestaurants, validVisitDate } from './restaurant-memory.ts';

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
  assert.equal(findRestaurants([saved], '', 'wish').length, 1);
});

test('search combines menu, memory, tags and notes; recent filter sorts dated visits only', () => {
  const older = withVisits({ ...restaurant, id: 'older', memory: '점심 피하기', tags: ['혼밥 좋음'], nextMenu: '수육' }, [visit('a', '2026-10-01')]);
  const newer = withVisits({ ...restaurant, id: 'newer' }, [visit('b', '2026-10-20')]);
  assert.equal(findRestaurants([older, newer], '수육 혼밥', 'all')[0].id, 'older');
  assert.equal(findRestaurants([older, newer], '칼국수', 'all').length, 2);
  assert.deepEqual(findRestaurants([older, restaurant, newer], '', 'recent').map(x => x.id), ['newer', 'older']);
  assert.equal(findRestaurants([older, restaurant], '', 'wish').length, 1);
});

test('visit date rejects impossible and future dates but accepts leap day', () => {
  assert.equal(validVisitDate('2026-02-30', '2026-10-28'), false);
  assert.equal(validVisitDate('2026-10-29', '2026-10-28'), false);
  assert.equal(validVisitDate('2024-02-29', '2026-10-28'), true);
  assert.equal(validVisitDate('', '2026-10-28'), false);
});
