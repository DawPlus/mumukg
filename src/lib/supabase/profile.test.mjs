import test from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayNickname, syncProfile } from './profile.ts';

test('uses Kakao profile nickname before provider fallback names', () => {
  assert.equal(getDisplayNickname({ user_metadata: { profile_nickname: '무무' } }), '무무');
  assert.equal(getDisplayNickname({ user_metadata: { nickname: '카카오닉네임' } }), '카카오닉네임');
  assert.equal(getDisplayNickname({ user_metadata: { name: '계정 이름' } }), '계정 이름');
  assert.equal(getDisplayNickname({ user_metadata: {} }), null);
});

test('profile sync always attributes the profile to immutable auth user id', async () => {
  let saved;
  const client = { from: table => {
    assert.equal(table, 'profiles');
    return { upsert: async (row, options) => { saved = { row, options }; return { error: null }; } };
  } };
  await syncProfile(client, { id: 'auth-user-1', user_metadata: { id: 'spoofed', profile_nickname: '무무' } });
  assert.deepEqual(saved, { row: { id: 'auth-user-1', nickname: '무무' }, options: { onConflict: 'id' } });
});
