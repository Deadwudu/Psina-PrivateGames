"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";

export async function submitTaskReport(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Не авторизован" };

  const userTaskId = (formData.get("user_task_id") as string)?.trim();
  const taskCompleted = formData.get("task_completed") === "true";
  const rapportComment = (formData.get("rapport_comment") as string) ?? "";

  if (!userTaskId) return { error: "Выберите задачу из списка" };

  const supabase = createServiceClient();
  const { data: task, error: taskErr } = await supabase
    .from("user_tasks")
    .select("id, user_id")
    .eq("id", userTaskId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (taskErr || !task) return { error: "Задача не найдена или не назначена вам" };

  const { data: existing, error: exErr } = await supabase
    .from("task_reports")
    .select("id")
    .eq("user_task_id", userTaskId)
    .maybeSingle();

  if (exErr) return { error: exErr.message };
  if (existing) return { error: "По этой задаче рапорт уже отправлен. Повторно отправить нельзя." };

  const contentMirror = rapportComment.trim() ? rapportComment : "(без комментария)";

  const { error } = await supabase.from("task_reports").insert({
    user_id: session.userId,
    user_task_id: userTaskId,
    task_completed: taskCompleted,
    rapport_comment: rapportComment,
    content: contentMirror,
    task_reference: null,
  });

  if (error) {
    if (error.code === "23505" || /unique|duplicate/i.test(error.message)) {
      return { error: "По этой задаче рапорт уже отправлен. Повторно отправить нельзя." };
    }
    return { error: error.message };
  }

  const { error: stErr } = await supabase
    .from("user_tasks")
    .update({ status: taskCompleted ? "done" : "pending" })
    .eq("id", userTaskId)
    .eq("user_id", session.userId);

  if (stErr) return { error: stErr.message };

  revalidatePath("/dashboard/rapport");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function submitHackResult(
  activityType: "door" | "server" | "decryption",
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: "Не авторизован" };

  const supabase = createServiceClient();
  const successRaw = formData.get("success") as string;
  const success = successRaw === "true";
  const notes = ((formData.get("notes") as string) || "").trim();
  const detailsJson = formData.get("details_json");

  const details: Record<string, unknown> = {};
  if (notes) details.notes = notes;
  if (typeof detailsJson === "string" && detailsJson.trim()) {
    try {
      const parsed = JSON.parse(detailsJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(details, parsed as Record<string, unknown>);
      }
    } catch {
      /* ignore */
    }
  }

  const { error } = await supabase.from("hack_results").insert({
    user_id: session.userId,
    activity_type: activityType,
    success,
    details,
  });
  if (error) return { error: error.message };

  const path =
    activityType === "door"
      ? "/dashboard/door-hack"
      : activityType === "server"
        ? "/dashboard/server-hack"
        : "/dashboard/decryption";
  revalidatePath(path);
  revalidatePath("/admin");
  return { ok: true as const };
}
