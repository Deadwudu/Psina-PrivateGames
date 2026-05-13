# Psina Private Games

Игро-технический инструмент для мероприятий: вход по **позывному и паролю** (без email и без Supabase Auth), данные в **Postgres (Supabase)**, деплой на **Vercel**.

Репозиторий: [github.com/Deadwudu/Psina-PrivateGames](https://github.com/Deadwudu/Psina-PrivateGames).

## Возможности

- **Роли:** Сторона А, Сторона Б (при регистрации), **Администратор** (назначается вручную в БД).
- **Главный экран:** Карта полигона, мои задачи, рапорт, взлом двери/сервера, дешифровка.
- **Админ:** выдача задач, правка рапортов, просмотр взломов/дешифровки.

Стек: **Next.js 15** (App Router), **Supabase** как хост Postgres, доступ с сервера через **service_role**; сессия — **httpOnly cookie** с JWT (`jose`), пароли — **bcrypt**.

## 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. **SQL Editor** → вставьте содержимое `supabase/migrations/001_initial.sql` → **Run** (один раз на чистую БД).
3. Затем выполните `supabase/migrations/002_task_reports_rapport.sql` (колонки рапорта: задача, «выполнено», комментарий).
4. Затем `supabase/migrations/003_shared_side_task_rapports.sql` (общие задачи стороне: `assignment_batch_id`, один рапорт на выдачу до успеха).
5. Затем `supabase/migrations/004_venue_map_stairs.sql` (исторически: фиксированные индикаторы; позже заменено).
6. Затем `supabase/migrations/005_venue_map_three_floors.sql` (убрать неиспользуемый пояс b3, если применяли 004 целиком).
7. Затем `supabase/migrations/006_venue_map_markers.sql` (динамические маркеры на карте: позиции в %, цвет; заменяет `venue_stair_states`).
8. **Settings → API** скопируйте **Project URL** и **service_role** secret (ключ не светите в браузере и не коммитьте).

**Администратор** (после регистрации участника с нужным позывным):

```sql
-- Пример: сделать админом пользователя с позывным «Бобер» (citext — регистр не важен)
update public.game_users set role = 'admin' where username = 'Бобер';
```

Supabase **Authentication (Email)** для этого приложения **не используется**: таблица пользователей — `public.game_users`.

## 2. Локально

```bash
npm install
cp .env.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET (см. .env.example)
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## 3. Vercel

1. Импортируйте репозиторий в [vercel.com](https://vercel.com).
2. В **Environment Variables** для **Production** добавьте те же три переменные, что в `.env.example`, затем **Redeploy**.

### Ошибка на сайте Vercel «Application error» / digest

1. **Vercel → Project → Settings → Environment Variables** — переменные для **Production**, после правок — **Redeploy**.
2. **Vercel → Deployments → выбранный деплой → Logs / Runtime Logs** — текст ошибки.

### Сборка на Vercel (Build Failed)

Страницы `/dashboard` и `/admin` помечены как **динамические** (`force-dynamic`). Если не заданы `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` или короткий `SESSION_SECRET`, главная перенаправит на `/login?missing=config` с подсказкой.

## Структура таблиц

| Таблица        | Назначение                          |
|----------------|-------------------------------------|
| `game_users`   | Позывной, хэш пароля, роль          |
| `user_tasks`   | Задачи участника                    |
| `task_reports` | Рапорты (текст + ссылка на задачу) |
| `hack_results` | Итоги взлома двери/сервера/дешифровки |
| `venue_map_markers` | Индикаторы на карте полигона: позиция в %, размер, цвет (`gray` / `green` / `red`) |

RLS в миграции отключён: доступ к данным идёт только через приложение с **service_role** на сервере (аналог отдельного бэкенда).
