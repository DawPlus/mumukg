import { createClient } from '@/lib/supabase/client';
import type { FoodStory } from '@/lib/types';

type StoryRow = {
  id: string; user_id: string; name: string; category: string; eaten_at: string;
  note: string; place: string; rating: number | null; amount: number | null;
  icon: string; created_at: string;
};

const fromRow = (row: StoryRow): FoodStory => ({
  id: row.id, name: row.name, category: row.category, eatenAt: row.eaten_at,
  note: row.note, place: row.place, rating: row.rating, amount: row.amount,
  icon: row.icon, createdAt: row.created_at,
});
const toRow = (item: FoodStory, userId: string): StoryRow => ({
  id: item.id, user_id: userId, name: item.name, category: item.category,
  eaten_at: item.eatenAt, note: item.note, place: item.place,
  rating: item.rating, amount: item.amount, icon: item.icon, created_at: item.createdAt,
});

/** Sync only the signed-in user's records. The original browser data remains a backup. */
export async function syncStoryRecords(local: FoodStory[]): Promise<FoodStory[]> {
  const client = createClient();
  if (!client) throw new Error('Supabase 연결이 설정되지 않았어.');
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('로그인 후 동기화할 수 있어.');
  const { data, error } = await client.from('food_stories').select('*').eq('user_id', user.id);
  if (error) throw error;
  const remote = (data ?? []).map(row => fromRow(row as StoryRow));
  const remoteIds = new Set(remote.map(x => x.id));
  const missing = local.filter(x => !remoteIds.has(x.id));
  if (missing.length) {
    const { error: importError } = await client.from('food_stories').insert(missing.map(x => toRow(x, user.id)));
    if (importError) throw importError;
  }
  return [...remote, ...missing].sort((a, b) => b.eatenAt.localeCompare(a.eatenAt) || b.createdAt.localeCompare(a.createdAt));
}

export async function saveStoryRecord(item: FoodStory) {
  const client = createClient();
  if (!client) throw new Error('Supabase 연결이 설정되지 않았어.');
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('로그인이 필요해.');
  const { error } = await client.from('food_stories').upsert(toRow(item, user.id));
  if (error) throw error;
}

export async function deleteStoryRecord(id: string) {
  const client = createClient();
  if (!client) throw new Error('Supabase 연결이 설정되지 않았어.');
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('로그인이 필요해.');
  const { error } = await client.from('food_stories').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}
