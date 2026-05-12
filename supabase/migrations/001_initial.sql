-- Psina Private Games — схема как в Diplom: пользователи без Supabase Auth / без email
-- Выполните в Supabase: SQL Editor → New query → Run (один раз на проект)

create extension if not exists pgcrypto;
create extension if not exists citext;

-- Роли участников мероприятия (админ только через SQL)
create type public.user_role as enum ('side_a', 'side_b', 'admin');

-- Пользователи: позывной (логин) + хэш пароля
create table public.game_users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  password_hash text not null,
  role public.user_role not null default 'side_a',
  created_at timestamptz not null default now()
);

create index game_users_role_idx on public.game_users (role);

create table public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.game_users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index user_tasks_user_id_idx on public.user_tasks (user_id);

create table public.task_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.game_users (id) on delete cascade,
  task_reference text,
  content text not null,
  created_at timestamptz not null default now()
);

create index task_reports_user_id_idx on public.task_reports (user_id);

create table public.hack_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.game_users (id) on delete cascade,
  activity_type text not null check (activity_type in ('door', 'server', 'decryption')),
  success boolean,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hack_results_user_id_idx on public.hack_results (user_id);
create index hack_results_type_idx on public.hack_results (activity_type);

-- RLS отключён: доступ к данным только через Next.js с service_role (как Node-сервер в Diplom).

-- Назначить администратора:
-- update public.game_users set role = 'admin' where username = 'ваш_позывной';
