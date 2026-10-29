-- Apply through a reviewed Supabase migration before enabling Story cloud sync.
-- This file does not alter the remote database automatically.
create table if not exists public.food_stories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  eaten_at date not null,
  note text not null default '',
  place text not null default '',
  rating integer check (rating between 1 and 5),
  amount numeric check (amount >= 0),
  icon text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists food_stories_user_day_idx on public.food_stories(user_id, eaten_at desc);
alter table public.food_stories enable row level security;
create policy "story select owner" on public.food_stories for select to authenticated using ((select auth.uid()) = user_id);
create policy "story insert owner" on public.food_stories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "story update owner" on public.food_stories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "story delete owner" on public.food_stories for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.food_stories to authenticated;
