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
4. **Authentication → URL configuration**: добавьте `http://localhost:3000` и URL продакшена Vercel в **Redirect URLs** (для колбэка после подтверждения письма, если оно включено).
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
