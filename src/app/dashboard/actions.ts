"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";

export async function submitTaskReport(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Не авторизован" };

  const supabase = createServiceClient();
  const taskRef = (formData.get("task_reference") as string)?.trim() || null;
  const content = (formData.get("content") as string)?.trim();
  if (!content) return { error: "Введите текст рапорта" };

  const { error } = await supabase.from("task_reports").insert({
    user_id: session.userId,
    task_reference: taskRef,
    content,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/rapport");
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

  const { error } = await supabase.from("hack_results").insert({
    user_id: session.userId,
    activity_type: activityType,
    success,
    details: { notes },
  });
  if (error) return { error: error.message };

  const path =
    activityType === "door"
      ? "/dashboard/door-hack"
      : activityType === "server"
        ? "/dashboard/server-hack"
        : "/dashboard/decryption";
  revalidatePath(path);
  return { ok: true as const };
}

export async function toggleTaskStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const supabase = createServiceClient();
  const taskId = formData.get("task_id") as string;
  const nextStatus = formData.get("next_status") as string;
  if (!taskId || !nextStatus) return;

  const { error } = await supabase
    .from("user_tasks")
    .update({ status: nextStatus })
    .eq("id", taskId)
    .eq("user_id", session.userId);
  if (error) {
    console.error(error.message);
    return;
  }
  revalidatePath("/dashboard/tasks");
}
