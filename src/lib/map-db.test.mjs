import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageMapVisit, canUpdateMapPlace, getImportMemory, getKakaoPlaceId, getMapRecordSavePlan, getMissingImportVisits, getStableVisitId, getVisitsToSave, resolveSavedMapRestaurant } from './map-import.ts';

test('an existing remote memory wins and a different local memory is reported as a conflict', () => {
  const remote = { memory: '이미 저장한 기억', tags: ['조용함'] };
  const result = getImportMemory(remote, { memory: '로컬 기억', tags: ['가성비'] });
  assert.deepEqual(result.memory, remote);
  assert.equal(result.conflict, true);
  assert.equal(getImportMemory(remote, remote).conflict, false);
});

test('reimport only returns visits with source IDs not already saved', () => {
  const visits = [{ sourceId: 'local:1:a' }, { sourceId: 'local:1:b' }, { sourceId: 'local:1:b' }];
  assert.deepEqual(getMissingImportVisits(['local:1:a'], visits), [visits[1]]);
});

test('places without Kakao IDs remain independent local imports', () => {
  const visits = [{ sourceId: 'local:direct:legacy-initial' }];
  assert.deepEqual(getMissingImportVisits([], visits), visits);
});

test('save selection uses the database place ID returned by the shared refresh', () => {
  const saved = { id: 'local-id', name: '새 가게' };
  const refreshed = [{ id: 'database-id', placeId: 'kakao-id', name: '새 가게' }];
  assert.equal(resolveSavedMapRestaurant({ id: 'database-id' }, refreshed), refreshed[0]);
  assert.equal(resolveSavedMapRestaurant({ id: 'database-id' }, refreshed).id, 'database-id');
  assert.equal(resolveSavedMapRestaurant(saved, refreshed), saved);
});

test('only a place creator can update shared place details', () => {
  assert.equal(canUpdateMapPlace('user-a', 'user-a'), true);
  assert.equal(canUpdateMapPlace('user-a', 'user-b'), false);
});

test('shared visit edit and delete controls require the visit owner', () => {
  assert.equal(canManageMapVisit({ userId: 'user-a' }, 'user-a', true), true);
  assert.equal(canManageMapVisit({ userId: 'user-a' }, 'user-b', true), false);
  assert.equal(canManageMapVisit({}, null, true), false);
  assert.equal(canManageMapVisit({}, null, false), true);
});

test('Kakao place lookup uses either normalized or nested Kakao IDs consistently', () => {
  assert.equal(getKakaoPlaceId({ placeId: 'normalized', kakaoPlace: { id: 'nested' } }), 'normalized');
  assert.equal(getKakaoPlaceId({ kakaoPlace: { id: 'nested' } }), 'nested');
  assert.equal(getKakaoPlaceId({}), undefined);
});

test('new visit insert keeps the client-generated ID across failed save retries', () => {
  const id = 'b3f3b3f3-8f56-4d0e-8c51-7070b379db56';
  assert.equal(getStableVisitId(id), id);
  assert.equal(getStableVisitId('legacy-initial'), undefined);
});

test('memory-only saves do not rewrite visit snapshots; only submitted visits are saved', () => {
  assert.deepEqual(getVisitsToSave(undefined), []);
  assert.deepEqual(getVisitsToSave([{ id: 'edited-visit' }]), [{ id: 'edited-visit' }]);
  assert.equal(getStableVisitId('b3f3b3f3-8f56-4d0e-8c51-7070b379db56'), 'b3f3b3f3-8f56-4d0e-8c51-7070b379db56');
});

test('saving a visit does not write stale place details or memory fields', () => {
  assert.deepEqual(getMapRecordSavePlan({ visits: [{ id: 'visit-1' }] }), {
    createPlace: false,
    saveMemory: false,
    placeName: undefined,
    visits: [{ id: 'visit-1' }],
  });
  assert.deepEqual(getMapRecordSavePlan({ createPlace: true, memory: true, placeName: '가게', visits: [] }), {
    createPlace: true,
    saveMemory: true,
    placeName: '가게',
    visits: [],
  });
});
