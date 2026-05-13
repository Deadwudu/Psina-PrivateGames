"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { isUuid } from "@/lib/uuid";

export type AdminTaskResult = { error: string };

function denyAdmin(): AdminTaskResult {
  return { error: "Нет прав администратора" };
}

export async function adminAssignTask(formData: FormData): Promise<AdminTaskResult | void> {
  const session = await getSession();
  if (!session?.isAdmin) return denyAdmin();

  const userId = (formData.get("user_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!userId) return { error: "Выберите участника" };
  if (!title) return { error: "Укажите заголовок" };
  if (!description) return { error: "Укажите текст задания" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("user_tasks").insert({
    user_id: userId,
    title,
    description,
    status: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/rapport");
}

/** Задача всей стороне: у каждого игрока с этой стороной появляется своя строка user_tasks. */
export async function adminAssignTaskToSide(formData: FormData): Promise<AdminTaskResult | void> {
  const session = await getSession();
  if (!session?.isAdmin) return denyAdmin();

  const targetSideId = (formData.get("target_side_id") as string)?.trim();
  const title = (formData.get("side_title") as string)?.trim();
  const description = (formData.get("side_description") as string)?.trim();

  if (!targetSideId || !isUuid(targetSideId)) {
    return { error: "Выберите сторону" };
  }
  if (!title) return { error: "Укажите заголовок" };
  if (!description) return { error: "Укажите текст задания" };

  const supabase = createServiceClient();
  const { data: sideRow, error: sideErr } = await supabase
    .from("game_sides")
    .select("id")
    .eq("id", targetSideId)
    .maybeSingle();
  if (sideErr || !sideRow) return { error: "Сторона не найдена" };

  const { data: players, error: listErr } = await supabase
    .from("game_users")
    .select("id")
    .eq("is_admin", false)
    .eq("side_id", targetSideId);

  if (listErr) return { error: listErr.message };
  const ids = (players as { id: string }[] | null)?.map((p) => p.id) ?? [];
  if (ids.length === 0) {
    return { error: "На выбранной стороне нет участников." };
  }

  const batchId = randomUUID();
  const rows = ids.map((user_id) => ({
    user_id,
    title,
    description,
    status: "pending" as const,
    assignment_batch_id: batchId,
  }));

  const { error } = await supabase.from("user_tasks").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/rapport");
}

const SIDE_NAME_MAX = 120;

export type AdminSideMutationResult = { error: string } | { ok: true };

export async function adminCreateSide(formData: FormData): Promise<AdminSideMutationResult> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: denyAdmin().error };

  const name = (formData.get("display_name") as string)?.trim() ?? "";
  if (!name || name.length > SIDE_NAME_MAX) {
    return { error: `Название от 1 до ${SIDE_NAME_MAX} символов` };
  }

  const supabase = createServiceClient();
  const { data: maxRow } = await supabase
    .from("game_sides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await supabase.from("game_sides").insert({
    display_name: name,
    sort_order: nextOrder,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function adminUpdateSide(formData: FormData): Promise<AdminSideMutationResult> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: denyAdmin().error };

  const sideId = (formData.get("side_id") as string)?.trim();
  const name = (formData.get("display_name") as string)?.trim() ?? "";
  if (!sideId || !isUuid(sideId)) return { error: "Некорректная сторона" };
  if (!name || name.length > SIDE_NAME_MAX) {
    return { error: `Название от 1 до ${SIDE_NAME_MAX} символов` };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("game_sides").update({ display_name: name }).eq("id", sideId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function adminDeleteSide(formData: FormData): Promise<AdminSideMutationResult> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: denyAdmin().error };

  const sideId = (formData.get("side_id") as string)?.trim();
  if (!sideId || !isUuid(sideId)) return { error: "Некорректная сторона" };

  const supabase = createServiceClient();
  const { count, error: cntErr } = await supabase
    .from("game_users")
    .select("id", { count: "exact", head: true })
    .eq("side_id", sideId);
  if (cntErr) return { error: cntErr.message };
  if (count && count > 0) {
    return { error: "На стороне есть игроки — сначала переведите их на другую сторону" };
  }

  const { error } = await supabase.from("game_sides").delete().eq("id", sideId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type AdminSetUserSideResult = { error: string } | { ok: true };

/** Смена стороны игрока; cookie игрока не обновляется — ему нужен повторный вход. */
export async function adminSetUserSide(formData: FormData): Promise<AdminSetUserSideResult> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: denyAdmin().error };

  const userId = (formData.get("user_id") as string)?.trim();
  const sideId = (formData.get("side_id") as string)?.trim();
  if (!userId || !isUuid(userId)) return { error: "Некорректный пользователь" };
  if (!sideId || !isUuid(sideId)) return { error: "Выберите сторону" };

  const supabase = createServiceClient();
  const { data: userRow, error: fetchErr } = await supabase
    .from("game_users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message };
  if (!userRow) return { error: "Пользователь не найден" };
  if (userRow.is_admin) return { error: "Нельзя менять сторону администратора" };

  const { data: sideOk, error: sideErr } = await supabase
    .from("game_sides")
    .select("id")
    .eq("id", sideId)
    .maybeSingle();
  if (sideErr || !sideOk) return { error: "Сторона не найдена" };

  const { error } = await supabase.from("game_users").update({ side_id: sideId }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rapport");
  return { ok: true };
}

export type AdminPurgeResult = { error: string } | { ok: true; cleared: string[] };

const PURGE_CONFIRM_WORD = "УДАЛИТЬ";

async function deleteAllRows(
  supabase: ReturnType<typeof createServiceClient>,
  table: string,
  label: string
): Promise<{ error: string } | null> {
  const { error } = await supabase.from(table).delete().gte("created_at", "1970-01-01T00:00:00Z");
  if (error) return { error: `${label}: ${error.message}` };
  return null;
}

/** Удаление игровых данных после мероприятия (учётные записи и стороны не меняются). */
export async function adminPurgeEventData(formData: FormData): Promise<AdminPurgeResult> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: denyAdmin().error };

  const typed = ((formData.get("purge_confirm") as string) ?? "").trim();
  if (typed !== PURGE_CONFIRM_WORD) {
    return { error: `Введите слово подтверждения: ${PURGE_CONFIRM_WORD}` };
  }

  const purgeReports = formData.get("purge_reports") === "on";
  const purgeHacks = formData.get("purge_hacks") === "on";
  const purgeTasks = formData.get("purge_tasks") === "on";
  const purgeVenue = formData.get("purge_venue_markers") === "on";

  if (!purgeReports && !purgeHacks && !purgeTasks && !purgeVenue) {
    return { error: "Отметьте хотя бы один блок данных" };
  }

  const supabase = createServiceClient();
  const cleared: string[] = [];

  if (purgeTasks) {
    const eRep = await deleteAllRows(supabase, "task_reports", "Рапорты");
    if (eRep) return eRep;
    const eUt = await deleteAllRows(supabase, "user_tasks", "Задачи");
    if (eUt) return eUt;
    cleared.push("Рапорты и выданные задачи");
  } else if (purgeReports) {
    const eRep = await deleteAllRows(supabase, "task_reports", "Рапорты");
    if (eRep) return eRep;
    cleared.push("Рапорты");
  }

  if (purgeHacks) {
    const e = await deleteAllRows(supabase, "hack_results", "Взломы");
    if (e) return e;
    cleared.push("Взломы и дешифровка");
  }

  if (purgeVenue) {
    const e = await deleteAllRows(supabase, "venue_map_markers", "Карта");
    if (e) return e;
    cleared.push("Маркеры карты полигона");
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/rapport");
  revalidatePath("/dashboard/venue-map");
  revalidatePath("/dashboard/door-hack");
  revalidatePath("/dashboard/server-hack");
  revalidatePath("/dashboard/decryption");

  return { ok: true, cleared };
}

export type AdminReportResult = { error: string };

export async function adminUpdateTaskReport(formData: FormData): Promise<AdminReportResult | void> {
  const session = await getSession();
  if (!session?.isAdmin) return denyAdmin();

  const reportId = (formData.get("report_id") as string)?.trim();
  if (!reportId) return { error: "Не указан рапорт" };

  const taskCompleted = formData.get("task_completed") === "true";
  const rapportComment = (formData.get("rapport_comment") as string) ?? "";

  const supabase = createServiceClient();
  const { data: rep, error: fetchErr } = await supabase
    .from("task_reports")
    .select("user_task_id, assignment_batch_id")
    .eq("id", reportId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!rep) return { error: "Рапорт не найден" };

  const contentMirror = rapportComment.trim() ? rapportComment : "(без комментария)";

  const { error } = await supabase
    .from("task_reports")
    .update({
      task_completed: taskCompleted,
      rapport_comment: rapportComment,
      content: contentMirror,
    })
    .eq("id", reportId);

  if (error) return { error: error.message };

  const repTyped = rep as { user_task_id: string | null; assignment_batch_id: string | null } | null;
  if (repTyped?.assignment_batch_id) {
    await supabase
      .from("user_tasks")
      .update({ status: taskCompleted ? "done" : "pending" })
      .eq("assignment_batch_id", repTyped.assignment_batch_id);
  } else if (repTyped?.user_task_id) {
    await supabase
      .from("user_tasks")
      .update({ status: taskCompleted ? "done" : "pending" })
      .eq("id", repTyped.user_task_id);
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/rapport");
  revalidatePath("/dashboard/tasks");
}
