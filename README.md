# Psina Private Games

Игро-технический инструмент для мероприятий: авторизация, роли, сохранение рапортов и результатов в **Supabase**, деплой на **Vercel**.

Репозиторий: [github.com/Deadwudu/Psina-PrivateGames](https://github.com/Deadwudu/Psina-PrivateGames).

## Возможности

- **Роли:** Сторона А, Сторона Б (при регистрации), **Администратор** (назначается вручную в БД).
- **Главный экран:** Мои задачи, Рапорт по задаче, Взлом двери, Взлом сервера, Дешифровка документов.
- **Админ:** просмотр всех рапортов и записей взломов/дешифровки.

Стек: **Next.js 15** (App Router), **Supabase Auth** + Postgres (RLS).

## 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. **SQL Editor** → вставьте содержимое `supabase/migrations/001_initial.sql` → **Run**.
3. **Authentication → Providers → Email**: включите email/password. Для теста можно отключить подтверждение email (**Confirm email** off).
4. **Authentication → URL configuration** (важно для продакшена на Vercel):
   - **Site URL** укажите как основной адрес сайта: `https://ваш-проект.vercel.app` (не оставляйте только `localhost` для production-проекта).
   - В **Redirect URLs** добавьте:
     - `https://ваш-проект.vercel.app/**`
     - `http://localhost:3000/**` (для локальной разработки)

Иначе редиректы после входа и ссылки из писем могут вести на localhost, а часть сценариев авторизации на проде ведёт себя непредсказуемо.

Если включено **подтверждение email**, в **Redirect URLs** добавьте полный callback приложения, например `https://ваш-проект.vercel.app/auth/callback` (или wildcard `https://ваш-проект.vercel.app/**`). Без этого ссылка из письма может не открываться.

5. Назначьте администратора (замените email):

```sql
update public.profiles set role = 'admin' where email = 'ваш@email.com';
```

## 2. Локально

```bash
npm install
cp .env.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY из Supabase → Settings → API
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## 3. Vercel

1. Импортируйте репозиторий в [vercel.com](https://vercel.com).
2. В **Environment Variables** добавьте те же `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Задеплойте. Укажите домен в Supabase → Auth → URL configuration.

### Ошибка на сайте Vercel «Application error» / digest

1. **Vercel → Project → Settings → Environment Variables** — переменные должны быть для **Production**, после правок — **Redeploy**.
2. **Vercel → Deployments → выбранный деплой → Logs / Runtime Logs** — там будет текст ошибки (если не хватает env, после правки в коде будет явное сообщение).
3. Проверьте **Site URL** в Supabase (см. выше): для продакшена не оставляйте только `localhost`.

### Сборка на Vercel (Build Failed) из‑за Supabase

Страницы `/dashboard` и `/admin` помечены как **динамические** (`force-dynamic`), а входные точки проверяют наличие `NEXT_PUBLIC_*` до вызова Supabase. Сборка не должна падать, если переменные вы добавите чуть позже; пока их нет, главная перенаправит на `/login?missing=supabase` с текстом-подсказкой.

### Ошибка Vercel `MIDDLEWARE_INVOCATION_FAILED`

Частая причина — устаревший паттерн с `request.cookies.set` в middleware (в Edge это падает). В репозитории используется исправленный вариант: только `NextResponse.cookies.set`.

Также проверьте: переменные заданы для окружения **Production** и после изменения env сделан **Redeploy**.

## Триггер на `auth.users`

Если при регистрации ошибка про триггер, в Supabase иногда нужно заменить в миграции строку `execute procedure public.handle_new_user ()` на `execute function public.handle_new_user ()` в зависимости от версии PostgreSQL в проекте.

## Структура таблиц

| Таблица        | Назначение                          |
|----------------|-------------------------------------|
| `profiles`     | Роль и имя пользователя             |
| `user_tasks`   | Задачи участника                    |
| `task_reports` | Рапорты (текст + ссылка на задачу) |
| `hack_results` | Итоги взлома двери/сервера/дешифровки |
