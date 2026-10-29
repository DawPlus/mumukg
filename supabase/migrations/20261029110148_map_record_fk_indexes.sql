create index map_places_created_by_idx on public.map_places (created_by);
create index map_visits_memory_id_user_id_idx on public.map_visits (memory_id, user_id);
create index map_memory_imports_memory_id_user_id_idx on public.map_memory_imports (memory_id, user_id);

drop policy "Approved members can read profiles" on public.profiles;
create policy "Users can read their own profile and members can read profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
