"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminTaskResult = { error: string };

export async function adminAssignTask(formData: FormData): Promise<AdminTaskResult | void> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Нет прав администратора" };
  }

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

/** Задача всей стороне: у каждого игрока с этой ролью появляется своя строка user_tasks. */
export async function adminAssignTaskToSide(formData: FormData): Promise<AdminTaskResult | void> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Нет прав администратора" };
  }

  const targetSide = (formData.get("target_side") as string)?.trim();
  const title = (formData.get("side_title") as string)?.trim();
  const description = (formData.get("side_description") as string)?.trim();

  if (targetSide !== "side_a" && targetSide !== "side_b") {
    return { error: "Выберите сторону А или Б" };
  }
  if (!title) return { error: "Укажите заголовок" };
  if (!description) return { error: "Укажите текст задания" };

  const supabase = createServiceClient();
  const { data: players, error: listErr } = await supabase
    .from("game_users")
    .select("id")
    .eq("role", targetSide);

  if (listErr) return { error: listErr.message };
  const ids = (players as { id: string }[] | null)?.map((p) => p.id) ?? [];
  if (ids.length === 0) {
    return { error: "На выбранной стороне нет участников (только эта роль учитывается)." };
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

export type AdminSideNamesResult = { error: string } | { ok: true };

const SIDE_NAME_MAX = 80;

/** Названия сторон в интерфейсе (роли side_a / side_b в БД не меняются). */
export async function adminSetSideDisplayNames(formData: FormData): Promise<AdminSideNamesResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Нет прав администратора" };
  }

  const sideA = (formData.get("side_a_name") as string)?.trim() ?? "";
  const sideB = (formData.get("side_b_name") as string)?.trim() ?? "";

  if (!sideA || !sideB) {
    return { error: "Укажите оба названия" };
  }
  if (sideA.length > SIDE_NAME_MAX || sideB.length > SIDE_NAME_MAX) {
    return { error: `Не длиннее ${SIDE_NAME_MAX} символов каждое` };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_settings").upsert(
    [
      { key: "side_a_display_name", value: sideA },
      { key: "side_b_display_name", value: sideB },
    ],
    { onConflict: "key" }
  );

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
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

/** Удаление игровых данных после мероприятия (учётные записи и названия сторон не меняются). */
export async function adminPurgeEventData(formData: FormData): Promise<AdminPurgeResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Нет прав администратора" };
  }

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
  if (!session || session.role !== "admin") {
    return { error: "Нет прав администратора" };
  }

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
