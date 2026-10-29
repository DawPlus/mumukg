-- Preserve the previous wishlist while keeping new visits independent of hearts.
alter table public.map_memories add column is_favorite boolean not null default false;
update public.map_memories m set is_favorite = true
where not m.visited and not exists (select 1 from public.map_visits v where v.memory_id = m.id);
