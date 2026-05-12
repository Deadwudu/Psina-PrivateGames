-- Рапорты: привязка к выданной задаче, флаг «выполнено», текст комментария
-- Выполните в Supabase SQL Editor после 001_initial.sql

alter table public.task_reports
  add column if not exists user_task_id uuid references public.user_tasks(id) on delete cascade;

alter table public.task_reports
  add column if not exists task_completed boolean not null default false;

alter table public.task_reports
  add column if not exists rapport_comment text not null default '';

-- перенос старых текстов рапорта в комментарий (если колонка content уже была)
update public.task_reports
set rapport_comment = coalesce(nullif(trim(content), ''), rapport_comment, '')
where rapport_comment = ''
  and content is not null
  and trim(content) <> '';

-- один рапорт на одну выданную задачу (для upsert по user_task_id; несколько NULL допускаются)
create unique index if not exists task_reports_user_task_id_key on public.task_reports (user_task_id);
