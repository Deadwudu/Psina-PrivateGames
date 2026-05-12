/** URL проекта Supabase (публично, для проверки в UI). */
export function isSupabaseUrlConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

/** Полная конфигурация бэкенда: Postgres через service role + сессия JWT. */
export function isAppConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secret = process.env.SESSION_SECRET?.trim();
  return !!(url && service && secret && secret.length >= 16);
}
