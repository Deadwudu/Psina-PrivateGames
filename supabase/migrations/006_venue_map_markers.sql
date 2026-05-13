-- Динамические маркеры на карте: позиция в %, цвет; номер на клиенте по порядку создания

drop table if exists public.venue_stair_states;

create table public.venue_map_markers (
  id uuid primary key default gen_random_uuid(),
  left_pct double precision not null check (left_pct >= 0 and left_pct <= 100),
  top_pct double precision not null check (top_pct >= 0 and top_pct <= 100),
  size_pct double precision not null default 3.4 check (size_pct > 0 and size_pct <= 25),
  color text not null check (color in ('gray', 'green', 'red')) default 'gray',
  created_at timestamptz not null default now()
);

create index venue_map_markers_created_idx on public.venue_map_markers (created_at asc);
