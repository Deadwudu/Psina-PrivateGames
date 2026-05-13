-- Отображаемые названия сторон (ключ side_a / side_b в enum не меняется)

create table public.app_settings (
  key text primary key check (char_length(key) <= 80),
  value text not null check (char_length(value) <= 120)
);

insert into public.app_settings (key, value) values
  ('side_a_display_name', 'Сторона А'),
  ('side_b_display_name', 'Сторона Б');
