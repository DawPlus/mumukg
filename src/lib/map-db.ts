import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from './supabase/client';
import { canUpdateMapPlace, getImportMemory, getKakaoPlaceId, getMapRecordSavePlan, getMissingImportVisits, getStableVisitId } from './map-import';
import type { MapMemory } from './types';
import { normalizeLegacyMapItem, projectMemberMemory, type MapRestaurant, type MapVisit } from '../app/map/restaurant-memory';

type DbRow = {
  id: string; user_id: string; memory_id: string; place_id: string; created_by: string;
  name: string; category: string; latitude: number; longitude: number; note: string;
  created_at: string; updated_at: string; kakao_place_id: string | null; address: string | null;
  phone: string | null; place_url: string | null; kakao_place: MapRestaurant['kakaoPlace'] | null;
  nickname: string | null; memory: string; next_menu: string | null; tags: string[]; visited: boolean;
  visit_date: string | null; stars: number | null; revisit: MapVisit['revisit'] | null;
  menu: string; reason: string; highlights: string[]; legacy_satisfaction: MapRestaurant['satisfaction'] | null;
  source_id: string | null; is_favorite: boolean;
};
export type MapImportResult = { imported: number; skipped: number; conflicts: number; visitsImported: number };
export type MapRecordSaveOptions = { createPlace?: boolean; memory?: boolean; favorite?: boolean; placeName?: string; visits?: MapVisit[] };

function getClient() {
  const client = createClient();
  if (!client) throw new Error('Supabase 환경변수 설정이 필요해.');
  return client;
}

async function getApprovedUser(client: SupabaseClient): Promise<User> {
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('로그인이 필요해.');
  const { data: membership, error: membershipError } = await client
    .from('decide_members').select('user_id').eq('user_id', user.id).maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error('승인된 멤버만 지도 기록을 공유할 수 있어.');
  return user;
}

function visitFromRow(row: DbRow, nickname: string): MapVisit {
  return {
    id: row.id,
    memoryId: row.memory_id,
    userId: row.user_id,
    nickname,
    date: row.visit_date ?? '',
    stars: row.stars ?? undefined,
    revisit: row.revisit ?? undefined,
    menu: row.menu,
    reason: row.reason,
    highlights: row.highlights ?? [],
    legacySatisfaction: row.legacy_satisfaction ?? undefined,
    sourceId: row.source_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function memoryFromRow(row: DbRow, nickname: string, visits: MapVisit[]): MapMemory {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    nickname,
    memory: row.memory,
    nextMenu: row.next_menu ?? undefined,
    tags: row.tags ?? [],
    visited: row.visited,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visits,
  };
}

async function fetchRows(client: SupabaseClient, table: string, filter?: { column: string; values: string[] }): Promise<DbRow[]> {
  let request = client.from(table).select('*');
  if (filter) request = request.in(filter.column, filter.values);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as unknown as DbRow[];
}

export async function loadSharedMap(): Promise<MapRestaurant[]> {
  const client = getClient();
  await getApprovedUser(client);
  const [places, memories, visits] = await Promise.all([
    fetchRows(client, 'map_places'),
    fetchRows(client, 'map_memories'),
    fetchRows(client, 'map_visits'),
  ]);
  const profileIds = [...new Set([...memories.map(row => row.user_id), ...places.map(row => row.created_by)])];
  const profiles = profileIds.length ? await fetchRows(client, 'profiles', { column: 'id', values: profileIds }) : [];
  const nicknameById = new Map(profiles.map(row => [row.id, row.nickname || '맛집러']));
  const visitsByMemory = new Map<string, MapVisit[]>();
  for (const row of visits) {
    const values = visitsByMemory.get(row.memory_id) ?? [];
    values.push(visitFromRow(row, nicknameById.get(row.user_id) ?? '맛집러'));
    visitsByMemory.set(row.memory_id, values);
  }
  const memoriesByPlace = new Map<string, MapMemory[]>();
  for (const row of memories) {
    const values = memoriesByPlace.get(row.place_id) ?? [];
    values.push(memoryFromRow(row, nicknameById.get(row.user_id) ?? '맛집러', visitsByMemory.get(row.id) ?? []));
    memoriesByPlace.set(row.place_id, values);
  }
  const current = (await client.auth.getUser()).data.user;
  return places.map((row) => {
    const contributors = memoriesByPlace.get(row.id) ?? [];
    return projectMemberMemory({
      id: row.id,
      name: row.name,
      category: row.category,
      latitude: row.latitude,
      longitude: row.longitude,
      note: row.note,
      visited: false,
      createdAt: row.created_at,
      placeId: row.kakao_place_id ?? undefined,
      kakaoPlaceId: row.kakao_place_id ?? undefined,
      address: row.address ?? undefined,
      phone: row.phone ?? undefined,
      placeUrl: row.place_url ?? undefined,
      kakaoPlace: row.kakao_place ?? undefined,
      memory: '',
      tags: [],
      visits: [],
      contributors,
      createdBy: row.created_by,
      creatorNickname: nicknameById.get(row.created_by) ?? '맛집러',
    } as MapRestaurant, current?.id ?? null);
  });
}

export function isMapMemberRequired(error: unknown): boolean {
  return error instanceof Error && error.message === '승인된 멤버만 지도 기록을 공유할 수 있어.';
}

async function findOrCreatePlace(client: SupabaseClient, user: User, item: MapRestaurant, localId?: string) {
  const kakaoPlaceId = getKakaoPlaceId(item);
  if (kakaoPlaceId) {
    const { data, error } = await client.from('map_places').select('id').eq('kakao_place_id', kakaoPlaceId).maybeSingle();
    if (error) throw error;
    if (data) return data.id as string;
  } else if (isUuid(item.id)) {
    const { data, error } = await client.from('map_places').select('id').eq('id', item.id).maybeSingle();
    if (error) throw error;
    if (data) return data.id as string;
  }
  if (!kakaoPlaceId && localId) {
    const { data, error } = await client.from('map_places').select('id')
      .eq('created_by', user.id).eq('source_local_restaurant_id', localId).maybeSingle();
    if (error) throw error;
    if (data) return data.id as string;
  }
  const { data, error } = await client.from('map_places').insert({
    ...(localId ? { source_local_restaurant_id: localId } : {}),
    kakao_place_id: kakaoPlaceId ?? null,
    name: item.name,
    category: item.category,
    latitude: item.latitude,
    longitude: item.longitude,
    note: '',
    address: item.address ?? item.kakaoPlace?.road_address_name ?? item.kakaoPlace?.address_name ?? null,
    phone: item.phone ?? item.kakaoPlace?.phone ?? null,
    place_url: item.placeUrl ?? item.kakaoPlace?.place_url ?? null,
    kakao_place: item.kakaoPlace ?? null,
    created_by: user.id,
  }).select('id').single();
  if (!error && data) return data.id as string;
  // Another member may have created the same Kakao place between the read and insert.
  if (kakaoPlaceId) {
    const { data: existing, error: lookupError } = await client.from('map_places').select('id').eq('kakao_place_id', kakaoPlaceId).maybeSingle();
    if (!lookupError && existing) return existing.id as string;
  }
  if (!kakaoPlaceId && localId) {
    const { data: existing, error: lookupError } = await client.from('map_places').select('id')
      .eq('created_by', user.id).eq('source_local_restaurant_id', localId).maybeSingle();
    if (!lookupError && existing) return existing.id as string;
  }
  throw error;
}

export async function saveMapPlace(item: MapRestaurant) {
  const client = getClient();
  const user = await getApprovedUser(client);
  return findOrCreatePlace(client, user, item);
}

export async function saveMapMemory(placeId: string, item: MapRestaurant) {
  const client = getClient();
  const user = await getApprovedUser(client);
  const values = {
    memory: item.memory ?? '',
    ...(item.isFavorite !== undefined ? { is_favorite: item.isFavorite } : {}),
    next_menu: item.nextMenu ?? null,
    tags: item.tags ?? [],
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: lookupError } = await client.from('map_memories').select('id')
    .eq('place_id', placeId).eq('user_id', user.id).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    const { error } = await client.from('map_memories').update(values).eq('id', existing.id);
    if (error) throw error;
    return existing.id as string;
  }
  const { data, error } = await client.from('map_memories').insert({ place_id: placeId, user_id: user.id, ...values }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

async function getOrCreateMemory(client: SupabaseClient, user: User, placeId: string) {
  const { data: existing, error: lookupError } = await client.from('map_memories').select('id')
    .eq('place_id', placeId).eq('user_id', user.id).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id as string;
  const { data, error } = await client.from('map_memories').insert({ place_id: placeId, user_id: user.id }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function saveMapVisit(memoryId: string, visit: MapVisit) {
  const client = getClient();
  const user = await getApprovedUser(client);
  const values = {
    memory_id: memoryId,
    user_id: user.id,
    visit_date: visit.date || null,
    stars: visit.stars ?? null,
    revisit: visit.revisit ?? null,
    menu: visit.menu,
    reason: visit.reason,
    highlights: visit.highlights ?? [],
    legacy_satisfaction: visit.legacySatisfaction ?? null,
    source_id: visit.sourceId ?? null,
    updated_at: new Date().toISOString(),
  };
  const stableId = getStableVisitId(visit.id);
  if (stableId) {
    const { data: existing, error: lookupError } = await client.from('map_visits').select('id').eq('id', stableId).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      const { error } = await client.from('map_visits').update(values).eq('id', stableId);
      if (error) throw error;
      return stableId;
    }
  }
  const { data, error } = await client.from('map_visits').insert({ ...values, ...(stableId ? { id: stableId } : {}) }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteMapVisit(visitId: string) {
  const client = getClient();
  await getApprovedUser(client);
  const { error } = await client.from('map_visits').delete().eq('id', visitId);
  if (error) throw error;
}

export async function saveMapRecord(item: MapRestaurant, options: MapRecordSaveOptions = {}) {
  const client = getClient();
  const user = await getApprovedUser(client);
  const plan = getMapRecordSavePlan(options);
  const placeId = plan.createPlace ? await findOrCreatePlace(client, user, item, item.id) : item.id;
  if (!isUuid(placeId)) throw new Error('저장된 가게를 찾지 못했어. 새로고침한 뒤 다시 시도해줘.');
  if (options.favorite !== undefined) {
    const memoryId = await getOrCreateMemory(client, user, placeId);
    const { error } = await client.from('map_memories').update({ is_favorite: options.favorite, updated_at: new Date().toISOString() })
      .eq('id', memoryId).eq('user_id', user.id);
    if (error) throw error;
  }
  if (plan.placeName !== undefined && item.createdBy && canUpdateMapPlace(item.createdBy, user.id)) {
    const { error } = await client.from('map_places').update({ name: plan.placeName, updated_at: new Date().toISOString() }).eq('id', placeId);
    if (error) throw error;
  }
  if (!plan.saveMemory && !plan.visits.length) return { ...item, id: placeId, visits: [] };
  const memoryId = plan.saveMemory ? await saveMapMemory(placeId, item) : await getOrCreateMemory(client, user, placeId);
  const savedVisits: MapVisit[] = [];
  for (const visit of plan.visits) {
    const id = await saveMapVisit(memoryId, visit);
    savedVisits.push({ ...visit, id });
  }
  if (plan.visits.length) {
    const { error } = await client.from('map_memories').update({ visited: true, updated_at: new Date().toISOString() })
      .eq('id', memoryId).eq('user_id', user.id);
    if (error) throw error;
  }
  return { ...item, id: placeId, visits: savedVisits };
}

export async function importLocalMap(localItems: MapRestaurant[]): Promise<MapImportResult> {
  const client = getClient();
  const user = await getApprovedUser(client);
  const result: MapImportResult = { imported: 0, skipped: 0, conflicts: 0, visitsImported: 0 };
  for (const item of localItems) {
    const normalized = normalizeLegacyMapItem(item);
    const { data: mapping, error: mappingError } = await client.from('map_memory_imports').select('memory_id')
      .eq('user_id', user.id).eq('local_restaurant_id', item.id).maybeSingle();
    if (mappingError) throw mappingError;
    let memoryId = mapping?.memory_id as string | undefined;
    let remoteMemory: DbRow | null = null;
    if (memoryId) {
      const { data, error } = await client.from('map_memories').select('*').eq('id', memoryId).maybeSingle();
      if (error) throw error;
      remoteMemory = data;
    }
    const placeId = await findOrCreatePlace(client, user, item, item.id);
    if (!remoteMemory) {
      const { data, error } = await client.from('map_memories').select('*')
        .eq('place_id', placeId).eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      remoteMemory = data;
      memoryId = data?.id;
    }
    const choice = getImportMemory(remoteMemory ? {
      memory: remoteMemory.memory,
      next_menu: remoteMemory.next_menu,
      tags: remoteMemory.tags ?? [],
      visited: remoteMemory.visited,
    } : null, {
      memory: normalized.memory.memory,
      next_menu: normalized.memory.nextMenu,
      tags: normalized.memory.tags,
      visited: normalized.memory.visited,
    });
    if (choice.conflict) result.conflicts += 1;
    if (!remoteMemory) {
      const { data, error } = await client.from('map_memories').insert({
        place_id: placeId, user_id: user.id, memory: choice.memory.memory,
        next_menu: choice.memory.next_menu ?? null, tags: choice.memory.tags, visited: choice.memory.visited,
        is_favorite: normalized.memory.isFavorite,
      }).select('id').single();
      if (error) throw error;
      memoryId = data.id;
      result.imported += 1;
    } else {
      result.skipped += 1;
    }
    if (!memoryId) throw new Error('가게 기록 ID를 확인하지 못했어.');
    const { error: saveMappingError } = await client.from('map_memory_imports').upsert({
      user_id: user.id, local_restaurant_id: item.id, memory_id: memoryId,
    }, { onConflict: 'user_id,local_restaurant_id' });
    if (saveMappingError) throw saveMappingError;
    const incomingVisits = normalized.visits.map(visit => ({ ...visit, sourceId: visit.sourceId! }));
    const sourceIds = incomingVisits.map(visit => visit.sourceId);
    const { data: existingRows, error: visitLookupError } = sourceIds.length
      ? await client.from('map_visits').select('source_id').eq('user_id', user.id).in('source_id', sourceIds)
      : { data: [], error: null };
    if (visitLookupError) throw visitLookupError;
    const missingVisits = getMissingImportVisits((existingRows ?? []).map(row => row.source_id), incomingVisits);
    if (missingVisits.length) {
      const { error } = await client.from('map_visits').insert(missingVisits.map(visit => ({
        memory_id: memoryId, user_id: user.id, visit_date: visit.date || null,
        stars: visit.stars ?? null, revisit: visit.revisit ?? null, menu: visit.menu,
        reason: visit.reason, highlights: visit.highlights ?? [],
        legacy_satisfaction: visit.legacySatisfaction ?? null, source_id: visit.sourceId,
      })));
      if (error) throw error;
      result.visitsImported += missingVisits.length;
    }
  }
  return result;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
