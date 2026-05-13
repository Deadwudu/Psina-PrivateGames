-- Слои карты полигона: несколько картинок (URL + порядок), маркеры привязаны к слою

create table if not exists public.venue_map_images (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  public_url text not null check (char_length(trim(public_url)) > 0),
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists venue_map_images_sort_idx on public.venue_map_images (sort_order);

alter table public.venue_map_markers add column if not exists venue_map_image_id uuid references public.venue_map_images (id) on delete cascade;

-- Стартовый слой (как раньше — статика из /public), если таблица пуста
insert into public.venue_map_images (sort_order, public_url, storage_path)
select 0, '/venue/building-floor-plans-marked.png', null
where not exists (select 1 from public.venue_map_images limit 1);

update public.venue_map_markers m
set venue_map_image_id = (
  select id from public.venue_map_images order by sort_order asc, created_at asc limit 1
)
where m.venue_map_image_id is null;

alter table public.venue_map_markers alter column venue_map_image_id set not null;

-- Публичный bucket для загрузок карты (чтение без авторизации для <img src>)
insert into storage.buckets (id, name, public)
values ('venue-maps', 'venue-maps', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "venue_maps_public_read" on storage.objects;
create policy "venue_maps_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'venue-maps');
