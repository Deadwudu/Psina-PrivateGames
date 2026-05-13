"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { signSessionToken } from "@/lib/auth/jwt";
import { createServiceClient } from "@/lib/supabase/service";
import { isAppConfigured } from "@/lib/supabase/config";
import { isUuid } from "@/lib/uuid";

const cookieOpts = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

export type AuthActionResult = { error: string };

export async function loginAction(formData: FormData): Promise<AuthActionResult | void> {
  if (!isAppConfigured()) return { error: "Сервер не настроен: проверьте переменные окружения." };

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Укажите позывной и пароль." };

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("game_users")
    .select("id, username, password_hash, is_admin, side_id")
    .eq("username", username)
    .maybeSingle();

  if (error || !row?.password_hash) {
    return { error: "Неверный позывной или пароль." };
  }

  const ok = await bcrypt.compare(password, row.password_hash as string);
  if (!ok) return { error: "Неверный позывной или пароль." };

  const isAdmin = Boolean(row.is_admin);
  const sideId = isAdmin ? null : (row.side_id as string | null);
  if (!isAdmin && (!sideId || !isUuid(sideId))) {
    return { error: "Учётная запись повреждена. Обратитесь к администратору." };
  }

  const token = await signSessionToken({
    id: row.id as string,
    username: String(row.username),
    isAdmin,
    sideId,
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOpts);
  redirect("/dashboard");
}

export async function registerAction(formData: FormData): Promise<AuthActionResult | void> {
  if (!isAppConfigured()) return { error: "Сервер не настроен: проверьте переменные окружения." };

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const sideIdRaw = String(formData.get("side_id") ?? "").trim();

  if (!username || username.length < 2) {
    return { error: "Позывной не короче 2 символов." };
  }
  if (password.length < 6) {
    return { error: "Пароль не короче 6 символов." };
  }
  if (!sideIdRaw || !isUuid(sideIdRaw)) {
    return { error: "Выберите сторону." };
  }

  const supabase = createServiceClient();
  const { data: sideOk, error: sideErr } = await supabase
    .from("game_sides")
    .select("id")
    .eq("id", sideIdRaw)
    .maybeSingle();

  if (sideErr || !sideOk) {
    return { error: "Выбранная сторона не найдена." };
  }

  const hash = await bcrypt.hash(password, 10);
  const { data: inserted, error } = await supabase
    .from("game_users")
    .insert({
      username,
      password_hash: hash,
      is_admin: false,
      side_id: sideIdRaw,
    })
    .select("id, username, is_admin, side_id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Такой позывной уже занят." };
    return { error: error.message };
  }

  if (!inserted) return { error: "Не удалось создать пользователя." };

  const token = await signSessionToken({
    id: inserted.id as string,
    username: String(inserted.username),
    isAdmin: false,
    sideId: inserted.side_id as string,
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOpts);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
