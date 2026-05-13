-- Карта полигона: состояние индикаторов лестниц (серый / зелёный / красный), общее для всех пользователей

create table public.venue_stair_states (
  stair_key text primary key,
  color text not null check (color in ('gray', 'green', 'red')) default 'gray',
  updated_at timestamptz not null default now()
);

create index venue_stair_states_updated_idx on public.venue_stair_states (updated_at desc);

-- 4 пояса сверху вниз (как на схеме: 4 этаж … 2 этаж), по 4 лестницы: левый центр, центр, верх справа, низ справа
insert into public.venue_stair_states (stair_key, color) values
  ('b0-left', 'gray'), ('b0-center', 'gray'), ('b0-tr', 'gray'), ('b0-br', 'gray'),
  ('b1-left', 'gray'), ('b1-center', 'gray'), ('b1-tr', 'gray'), ('b1-br', 'gray'),
  ('b2-left', 'gray'), ('b2-center', 'gray'), ('b2-tr', 'gray'), ('b2-br', 'gray'),
  ('b3-left', 'gray'), ('b3-center', 'gray'), ('b3-tr', 'gray'), ('b3-br', 'gray')
on conflict (stair_key) do nothing;
