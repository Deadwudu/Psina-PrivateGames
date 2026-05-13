-- Динамические стороны: таблица game_sides, у пользователей is_admin + side_id вместо enum user_role

create table if not exists public.game_sides (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists game_sides_sort_idx on public.game_sides (sort_order);

alter table public.game_users add column if not exists side_id uuid references public.game_sides (id);
alter table public.game_users add column if not exists is_admin boolean;

insert into public.game_sides (display_name, sort_order)
select * from (values ('Сторона А', 0), ('Сторона Б', 1)) as v (name, ord)
where not exists (select 1 from public.game_sides limit 1);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_users'
      and column_name = 'role'
  ) then
    update public.game_users gu
    set
      is_admin = (gu.role::text = 'admin'),
      side_id = case gu.role::text
        when 'side_a' then (select id from public.game_sides where sort_order = 0 limit 1)
        when 'side_b' then (select id from public.game_sides where sort_order = 1 limit 1)
        else null
      end;

    alter table public.game_users alter column is_admin set default false;
    update public.game_users set is_admin = coalesce(is_admin, false);
    alter table public.game_users alter column is_admin set not null;

    alter table public.game_users drop column role;
    drop type public.user_role;
    drop index if exists public.game_users_role_idx;
  end if;
end $$;

alter table public.game_users drop constraint if exists game_users_admin_side_chk;
alter table public.game_users add constraint game_users_admin_side_chk check (
  (is_admin = true and side_id is null)
  or (is_admin = false and side_id is not null)
);

create index if not exists game_users_side_id_idx on public.game_users (side_id);

delete from public.app_settings where key in ('side_a_display_name', 'side_b_display_name');
