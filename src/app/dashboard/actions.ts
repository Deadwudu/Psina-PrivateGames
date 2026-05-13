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
    .select("id, user_id, assignment_batch_id")
    .eq("id", userTaskId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (taskErr || !task) return { error: "Задача не найдена или не назначена вам" };

  const batchId = task.assignment_batch_id as string | null;
  const contentMirror = rapportComment.trim() ? rapportComment : "(без комментария)";

  async function syncBatchTaskRows(bid: string, completed: boolean) {
    await supabase
      .from("user_tasks")
      .update({ status: completed ? "done" : "pending" })
      .eq("assignment_batch_id", bid);
  }

  if (!batchId) {
    const { data: existing, error: exErr } = await supabase
      .from("task_reports")
      .select("id")
      .eq("user_task_id", userTaskId)
      .maybeSingle();

    if (exErr) return { error: exErr.message };
    if (existing) return { error: "По этой задаче рапорт уже отправлен. Повторно отправить нельзя." };

    const { error } = await supabase.from("task_reports").insert({
      user_id: session.userId,
      user_task_id: userTaskId,
      assignment_batch_id: null,
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
  } else {
    const { data: batchRep, error: brErr } = await supabase
      .from("task_reports")
      .select("id, task_completed")
      .eq("assignment_batch_id", batchId)
      .maybeSingle();

    if (brErr) return { error: brErr.message };
    if (batchRep?.task_completed === true) {
      return {
        error:
          "По этой общей задаче уже есть рапорт об успешном выполнении. Другой рапорт отправить нельзя.",
      };
    }

    if (!batchRep) {
      const { error } = await supabase.from("task_reports").insert({
        user_id: session.userId,
        user_task_id: null,
        assignment_batch_id: batchId,
        task_completed: taskCompleted,
        rapport_comment: rapportComment,
        content: contentMirror,
        task_reference: null,
      });
      if (error) {
        if (error.code === "23505" || /unique|duplicate/i.test(error.message)) {
          return {
            error:
              "По этой общей задаче уже есть рапорт об успешном выполнении. Другой рапорт отправить нельзя.",
          };
        }
        return { error: error.message };
      }
      await syncBatchTaskRows(batchId, taskCompleted);
    } else {
      const { error } = await supabase
        .from("task_reports")
        .update({
          user_id: session.userId,
          task_completed: taskCompleted,
          rapport_comment: rapportComment,
          content: contentMirror,
        })
        .eq("id", batchRep.id as string);

      if (error) return { error: error.message };
      await syncBatchTaskRows(batchId, taskCompleted);
    }
  }

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

  const venueMarkerIdRaw = ((formData.get("venue_marker_id") as string) ?? "").trim();
  if (venueMarkerIdRaw) details.venue_marker_id = venueMarkerIdRaw;

  const { error } = await supabase.from("hack_results").insert({
    user_id: session.userId,
    activity_type: activityType,
    success,
    details,
  });
  if (error) return { error: error.message };

  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(venueMarkerIdRaw);
  if (
    activityType === "door" &&
    success &&
    venueMarkerIdRaw &&
    uuidOk
  ) {
    const { error: markerErr } = await supabase
      .from("venue_map_markers")
      .update({ color: "green" })
      .eq("id", venueMarkerIdRaw);
    if (markerErr) {
      console.error("submitHackResult venue marker update", markerErr.message);
    }
    revalidatePath("/dashboard/venue-map");
  }

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
