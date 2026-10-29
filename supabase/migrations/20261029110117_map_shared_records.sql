create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  updated_at timestamptz not null default now()
);

create table public.map_places (
  id uuid primary key default gen_random_uuid(),
  kakao_place_id text unique,
  name text not null,
  category text not null default '',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  note text not null default '',
  address text,
  phone text,
  place_url text,
  kakao_place jsonb,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.map_memories (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.map_places (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  memory text not null default '',
  next_menu text,
  tags text[] not null default '{}',
  visited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id),
  unique (id, user_id)
);

create table public.map_visits (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null,
  user_id uuid not null,
  visit_date date,
  stars smallint check (stars between 1 and 5),
  revisit text check (revisit in ('yes', 'maybe', 'no')),
  menu text not null default '',
  reason text not null default '',
  highlights text[] not null default '{}',
  legacy_satisfaction text check (legacy_satisfaction in ('satisfied', 'unsatisfied')),
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (memory_id, user_id) references public.map_memories (id, user_id) on delete cascade,
  unique (user_id, source_id)
);

create table public.map_memory_imports (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_restaurant_id text not null,
  memory_id uuid not null,
  imported_at timestamptz not null default now(),
  primary key (user_id, local_restaurant_id),
  foreign key (memory_id, user_id) references public.map_memories (id, user_id) on delete cascade
);

create index map_memories_user_id_idx on public.map_memories (user_id);
create index map_memories_place_id_idx on public.map_memories (place_id);
create index map_visits_memory_date_idx on public.map_visits (memory_id, visit_date desc);

alter table public.profiles enable row level security;
alter table public.map_places enable row level security;
alter table public.map_memories enable row level security;
alter table public.map_visits enable row level security;
alter table public.map_memory_imports enable row level security;

grant select on public.profiles, public.map_places, public.map_memories, public.map_visits to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.map_places to authenticated;
grant insert, update, delete on public.map_memories, public.map_visits to authenticated;
grant select, insert, update, delete on public.map_memory_imports to authenticated;

create policy "Approved members can read profiles"
  on public.profiles for select to authenticated
  using (exists (select 1 from public.decide_members m where m.user_id = (select auth.uid())));
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Approved members can read places"
  on public.map_places for select to authenticated
  using (exists (select 1 from public.decide_members m where m.user_id = (select auth.uid())));
create policy "Approved members can create places"
  on public.map_places for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Place creators can update places"
  on public.map_places for update to authenticated
  using (
    created_by = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  )
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Place creators can delete unused places"
  on public.map_places for delete to authenticated
  using (
    created_by = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );

create policy "Approved members can read memories"
  on public.map_memories for select to authenticated
  using (exists (select 1 from public.decide_members m where m.user_id = (select auth.uid())));
create policy "Users can create their own memories"
  on public.map_memories for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can update their own memories"
  on public.map_memories for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can delete their own memories"
  on public.map_memories for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );

create policy "Approved members can read visits"
  on public.map_visits for select to authenticated
  using (exists (select 1 from public.decide_members m where m.user_id = (select auth.uid())));
create policy "Users can create their own visits"
  on public.map_visits for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can update their own visits"
  on public.map_visits for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can delete their own visits"
  on public.map_visits for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );

create policy "Users can read their own import mappings"
  on public.map_memory_imports for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Approved members can create their own import mappings"
  on public.map_memory_imports for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can update their own import mappings"
  on public.map_memory_imports for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
create policy "Users can delete their own import mappings"
  on public.map_memory_imports for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.decide_members m where m.user_id = (select auth.uid()))
  );
