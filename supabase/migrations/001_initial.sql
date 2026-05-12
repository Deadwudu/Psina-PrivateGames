-- Psina Private Games — начальная схема
-- Выполните в Supabase: SQL Editor → New query → Run

-- Роли участников мероприятия (админ не выбирается при регистрации)
create type public.user_role as enum ('side_a', 'side_b', 'admin');

-- Профиль на каждого пользователя auth
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  role public.user_role not null default 'side_a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Задачи (в т.ч. назначенные админом)
create table public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index user_tasks_user_id_idx on public.user_tasks (user_id);

-- Рапорт по задаче
create table public.task_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_reference text,
  content text not null,
  created_at timestamptz not null default now()
);

create index task_reports_user_id_idx on public.task_reports (user_id);

-- Результаты взломов / дешифровки
create table public.hack_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null check (activity_type in ('door', 'server', 'decryption')),
  success boolean,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hack_results_user_id_idx on public.hack_results (user_id);
create index hack_results_type_idx on public.hack_results (activity_type);

-- Проверка роли администратора (для RLS)
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.role = 'admin'
      from public.profiles p
      where p.id = auth.uid ()
    ),
    false
  );
$$;

-- Профиль при регистрации (роль только side_a / side_b из metadata)
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  chosen public.user_role;
begin
  meta_role := coalesce(new.raw_user_meta_data ->> 'role', 'side_a');
  if meta_role = 'side_b' then
    chosen := 'side_b'::public.user_role;
  else
    chosen := 'side_a'::public.user_role;
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    chosen
  );
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

alter table public.profiles enable row level security;
alter table public.user_tasks enable row level security;
alter table public.task_reports enable row level security;
alter table public.hack_results enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using ((select auth.uid ()) = id or public.is_admin ());

-- user_tasks
create policy "user_tasks_select"
  on public.user_tasks for select to authenticated
  using ((select auth.uid ()) = user_id or public.is_admin ());

create policy "user_tasks_insert"
  on public.user_tasks for insert to authenticated
  with check ((select auth.uid ()) = user_id or public.is_admin ());

create policy "user_tasks_update"
  on public.user_tasks for update to authenticated
  using ((select auth.uid ()) = user_id or public.is_admin ());

-- task_reports
create policy "task_reports_select"
  on public.task_reports for select to authenticated
  using ((select auth.uid ()) = user_id or public.is_admin ());

create policy "task_reports_insert"
  on public.task_reports for insert to authenticated
  with check ((select auth.uid ()) = user_id);

-- hack_results
create policy "hack_results_select"
  on public.hack_results for select to authenticated
  using ((select auth.uid ()) = user_id or public.is_admin ());

create policy "hack_results_insert"
  on public.hack_results for insert to authenticated
  with check ((select auth.uid ()) = user_id);

-- Назначить администратора (замените email):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
