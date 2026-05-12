-- Общие задачи стороне: все user_tasks одной выдачи с одинаковым assignment_batch_id.
-- Один рапорт на batch в task_reports (assignment_batch_id); user_task_id для таких рапортов NULL.
-- Пока нет рапорта с task_completed = true, строку рапорта можно перезаписать (неудача → успех).

alter table public.user_tasks
  add column if not exists assignment_batch_id uuid;

create index if not exists user_tasks_assignment_batch_id_idx
  on public.user_tasks (assignment_batch_id)
  where assignment_batch_id is not null;

alter table public.task_reports
  add column if not exists assignment_batch_id uuid;

-- старый уникальный индекс по user_task_id мешает общим рапортам (user_task_id = null)
drop index if exists public.task_reports_user_task_id_key;

-- личная задача: один рапорт на свой user_tasks.id
create unique index if not exists task_reports_personal_user_task_key
  on public.task_reports (user_task_id)
  where assignment_batch_id is null
    and user_task_id is not null;

-- общая выдача: один рапорт на assignment_batch_id
create unique index if not exists task_reports_side_batch_key
  on public.task_reports (assignment_batch_id)
  where assignment_batch_id is not null;
