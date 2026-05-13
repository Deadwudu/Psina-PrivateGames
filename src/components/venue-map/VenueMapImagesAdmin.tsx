"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDeleteVenueMapImage,
  adminReorderVenueMapImages,
  adminUploadVenueMapImage,
  type VenueMapImageMutation,
  type VenueMapImageRow,
} from "@/app/dashboard/venue-map-actions";

type Props = {
  images: VenueMapImageRow[];
};

async function uploadAct(
  _p: VenueMapImageMutation | null,
  formData: FormData
): Promise<VenueMapImageMutation | null> {
  return (await adminUploadVenueMapImage(formData)) ?? null;
}

async function deleteAct(
  _p: VenueMapImageMutation | null,
  formData: FormData
): Promise<VenueMapImageMutation | null> {
  return (await adminDeleteVenueMapImage(formData)) ?? null;
}

function DeleteLayerForm({ imageId }: { imageId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteAct, null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) router.refresh();
  }, [state, router]);

  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Удалить этот слой карты? Маркеры на нём будут удалены.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="image_id" value={imageId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-900/50 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
      >
        {pending ? "…" : "Удалить"}
      </button>
      {state && "error" in state && <span className="ml-2 text-xs text-red-400">{state.error}</span>}
    </form>
  );
}

export function VenueMapImagesAdmin({ images }: Props) {
  const router = useRouter();
  const [ordered, setOrdered] = useState<VenueMapImageRow[]>(() =>
    [...images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reorderErr, setReorderErr] = useState<string | null>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadAct, null);

  useEffect(() => {
    setOrdered([...images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)));
  }, [images]);

  useEffect(() => {
    if (uploadState && "ok" in uploadState && uploadState.ok) {
      router.refresh();
    }
  }, [uploadState, router]);

  async function applyReorder(nextOrdered: VenueMapImageRow[]) {
    const fd = new FormData();
    fd.set("ids", JSON.stringify(nextOrdered.map((x) => x.id)));
    const res = await adminReorderVenueMapImages(fd);
    if ("error" in res) {
      setReorderErr(res.error);
      setOrdered([...images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)));
      return;
    }
    setReorderErr(null);
    router.refresh();
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDraggingId(null);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!fromId || fromId === targetId) return;

    const arr = [...ordered];
    const fromIdx = arr.findIndex((x) => x.id === fromId);
    const toIdx = arr.findIndex((x) => x.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    setOrdered(arr);
    void applyReorder(arr);
  }

  return (
    <section className="panel mb-6 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Слои карты</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Загрузите одно или несколько изображений (JPEG, PNG, WebP, GIF, SVG, BMP, AVIF, до 10 МБ). Порядок сверху вниз на
          странице совпадает с порядком блоков ниже — перетащите миниатюры, чтобы поменять порядок этажей.
        </p>
      </div>

      <form action={uploadAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Файл</label>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp,image/avif"
            className="max-w-[min(100%,280px)] text-sm text-[var(--muted)] file:mr-2 file:rounded file:border file:border-[var(--border)] file:bg-[var(--panel)] file:px-2 file:py-1"
            required
            disabled={uploadPending}
          />
        </div>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm" disabled={uploadPending}>
          {uploadPending ? "Загрузка…" : "Добавить слой"}
        </button>
        {uploadState && "error" in uploadState && (
          <p className="w-full text-sm text-red-400">{uploadState.error}</p>
        )}
        {uploadState && "ok" in uploadState && uploadState.ok && (
          <p className="w-full text-sm text-emerald-400/90">Слой добавлен.</p>
        )}
      </form>

      {reorderErr && <p className="text-sm text-red-400">{reorderErr}</p>}

      {ordered.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {ordered.map((img, idx) => (
            <li
              key={img.id}
              draggable
              onDragStart={(e) => onDragStart(e, img.id)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, img.id)}
              className={`flex w-36 flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2 ${
                draggingId === img.id ? "opacity-60" : ""
              }`}
            >
              <div className="flex cursor-grab items-center justify-between gap-1 active:cursor-grabbing">
                <span className="text-xs text-[var(--muted)]">#{idx + 1}</span>
                <span className="text-[10px] text-[var(--accent-dim)]" title="Перетащите блок">
                  ⋮⋮
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.public_url}
                alt=""
                className="aspect-[4/3] w-full rounded object-cover"
                draggable={false}
              />
              <DeleteLayerForm imageId={img.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
