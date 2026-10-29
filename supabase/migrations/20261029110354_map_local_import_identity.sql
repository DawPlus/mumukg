alter table public.map_places add column source_local_restaurant_id text;
create unique index map_places_creator_local_source_key
  on public.map_places (created_by, source_local_restaurant_id)
  where source_local_restaurant_id is not null;
