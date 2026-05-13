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
