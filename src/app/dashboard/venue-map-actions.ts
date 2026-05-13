"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { cycleMarkerColor, type MarkerColor } from "@/lib/venue-map-markers";
import { isUuid } from "@/lib/uuid";

export type VenueMapImageRow = {
  id: string;
  public_url: string;
  sort_order: number;
};

export type VenueMarkerRow = {
  id: string;
  venue_map_image_id: string;
  left_pct: number;
  top_pct: number;
  size_pct: number;
  color: MarkerColor;
  created_at: string;
  displayNum: number;
};

const MAP_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const MAP_IMAGE_MAX_COUNT = 30;

function isMarkerColor(s: string): s is MarkerColor {
  return s === "gray" || s === "green" || s === "red";
}

function extForImageMime(mime: string): string | null {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  switch (m) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    case "image/bmp":
    case "image/x-ms-bmp":
      return ".bmp";
    case "image/avif":
      return ".avif";
    default:
      return null;
  }
}

export async function fetchVenueMapImages(): Promise<VenueMapImageRow[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("venue_map_images")
    .select("id, public_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchVenueMapImages", error.message);
    return [];
  }

  return (data ?? []) as VenueMapImageRow[];
}

export async function fetchVenueMarkers(): Promise<VenueMarkerRow[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("venue_map_markers")
    .select("id, venue_map_image_id, left_pct, top_pct, size_pct, color, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchVenueMarkers", error.message);
    return [];
  }

  return (data ?? []).map((row, index) => ({
    id: row.id as string,
    venue_map_image_id: row.venue_map_image_id as string,
    left_pct: Number(row.left_pct),
    top_pct: Number(row.top_pct),
    size_pct: Number(row.size_pct ?? 3.4),
    color: isMarkerColor(String(row.color)) ? (row.color as MarkerColor) : "gray",
    created_at: row.created_at as string,
    displayNum: index + 1,
  }));
}

export async function adminAddVenueMarker(
  venueMapImageId: string,
  leftPct: number,
  topPct: number
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  if (!isUuid(venueMapImageId)) return { error: "Некорректный слой карты" };

  const x = Math.min(100, Math.max(0, leftPct));
  const y = Math.min(100, Math.max(0, topPct));

  const supabase = createServiceClient();
  const { data: layer, error: layerErr } = await supabase
    .from("venue_map_images")
    .select("id")
    .eq("id", venueMapImageId)
    .maybeSingle();
  if (layerErr || !layer) return { error: "Слой карты не найден" };

  const { error } = await supabase.from("venue_map_markers").insert({
    venue_map_image_id: venueMapImageId,
    left_pct: x,
    top_pct: y,
    color: "gray",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminUpdateVenueMarkerPosition(
  id: string,
  leftPct: number,
  topPct: number
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const x = Math.min(100, Math.max(0, leftPct));
  const y = Math.min(100, Math.max(0, topPct));

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("venue_map_markers")
    .update({ left_pct: x, top_pct: y })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminDeleteVenueMarker(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_map_markers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminCycleVenueMarkerColor(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const supabase = createServiceClient();
  const { data: row, error: fetchErr } = await supabase
    .from("venue_map_markers")
    .select("color")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!row) return { error: "Маркер не найден" };

  const cur = isMarkerColor(String(row.color)) ? (row.color as MarkerColor) : "gray";
  const next = cycleMarkerColor(cur);

  const { error } = await supabase.from("venue_map_markers").update({ color: next }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export type VenueMapImageMutation = { error: string } | { ok: true };

export async function adminUploadVenueMapImage(formData: FormData): Promise<VenueMapImageMutation> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) return { error: "Выберите файл изображения" };
  if (file.size > MAP_IMAGE_MAX_BYTES) return { error: "Файл не больше 10 МБ" };

  const mime = (file.type || "").toLowerCase();
  if (!mime.startsWith("image/")) return { error: "Нужен файл с типом image/*" };
  const ext = extForImageMime(mime);
  if (!ext) {
    return { error: "Поддерживаются: JPEG, PNG, WebP, GIF, SVG, BMP, AVIF" };
  }

  const supabase = createServiceClient();
  const { count, error: cntErr } = await supabase
    .from("venue_map_images")
    .select("id", { count: "exact", head: true });
  if (cntErr) return { error: cntErr.message };
  if (count !== null && count >= MAP_IMAGE_MAX_COUNT) {
    return { error: `Не больше ${MAP_IMAGE_MAX_COUNT} слоёв карты` };
  }

  const objectPath = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("venue-maps").upload(objectPath, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) return { error: upErr.message };

  const { data: pub } = supabase.storage.from("venue-maps").getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl;

  const { data: maxRow } = await supabase
    .from("venue_map_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error: insErr } = await supabase.from("venue_map_images").insert({
    public_url: publicUrl,
    storage_path: objectPath,
    sort_order: nextOrder,
  });
  if (insErr) {
    await supabase.storage.from("venue-maps").remove([objectPath]);
    return { error: insErr.message };
  }

  revalidatePath("/dashboard/venue-map");
  return { ok: true };
}

export async function adminDeleteVenueMapImage(formData: FormData): Promise<VenueMapImageMutation> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const id = (formData.get("image_id") as string)?.trim();
  if (!id || !isUuid(id)) return { error: "Некорректный идентификатор" };

  const supabase = createServiceClient();
  const { count, error: cntErr } = await supabase
    .from("venue_map_images")
    .select("id", { count: "exact", head: true });
  if (cntErr) return { error: cntErr.message };
  if (count !== null && count <= 1) {
    return { error: "Нельзя удалить последний слой карты" };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("venue_map_images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message };
  if (!row) return { error: "Слой не найден" };

  const storagePath = row.storage_path as string | null;
  if (storagePath) {
    const { error: rmErr } = await supabase.storage.from("venue-maps").remove([storagePath]);
    if (rmErr) return { error: rmErr.message };
  }

  const { error: delErr } = await supabase.from("venue_map_images").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true };
}

export async function adminReorderVenueMapImages(formData: FormData): Promise<VenueMapImageMutation> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const raw = (formData.get("ids") as string)?.trim();
  if (!raw) return { error: "Пустой порядок" };

  let ids: unknown;
  try {
    ids = JSON.parse(raw);
  } catch {
    return { error: "Некорректный JSON порядка" };
  }
  if (!Array.isArray(ids) || ids.length === 0) return { error: "Некорректный список" };
  const strIds = ids.map((x) => String(x).trim());
  if (!strIds.every((s) => isUuid(s))) return { error: "Некорректные id" };
  if (new Set(strIds).size !== strIds.length) return { error: "Повторяющиеся id" };

  const supabase = createServiceClient();
  const { data: existing, error: exErr } = await supabase.from("venue_map_images").select("id");
  if (exErr) return { error: exErr.message };
  const setDb = new Set((existing as { id: string }[] | null)?.map((r) => r.id) ?? []);
  if (setDb.size !== strIds.length) return { error: "Список слоёв не совпадает с базой" };
  for (const id of strIds) {
    if (!setDb.has(id)) return { error: "Неизвестный id в порядке" };
  }

  for (let i = 0; i < strIds.length; i++) {
    const { error } = await supabase.from("venue_map_images").update({ sort_order: i }).eq("id", strIds[i]);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/venue-map");
  return { ok: true };
}
