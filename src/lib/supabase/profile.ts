import type { SupabaseClient, User } from '@supabase/supabase-js';

export function getDisplayNickname(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  for (const value of [metadata.profile_nickname, metadata.nickname, metadata.name, metadata.full_name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export async function syncProfile(client: SupabaseClient, user: User) {
  const { error } = await client.from('profiles').upsert({
    id: user.id,
    nickname: getDisplayNickname(user),
  }, { onConflict: 'id' });
  if (error) throw error;
}
