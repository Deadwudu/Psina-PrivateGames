"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminAddVenueMarker,
  adminCycleVenueMarkerColor,
  adminDeleteVenueMarker,
  adminUpdateVenueMarkerPosition,
  fetchVenueMarkers,
  type VenueMapImageRow,
  type VenueMarkerRow,
} from "@/app/dashboard/venue-map-actions";
import type { MarkerColor } from "@/lib/venue-map-markers";
import { VenueMapImagesAdmin } from "@/components/venue-map/VenueMapImagesAdmin";

const COLOR_CLASS: Record<MarkerColor, string> = {
  gray: "bg-zinc-500 ring-2 ring-white/50 shadow-lg",
  green: "bg-emerald-500 ring-2 ring-emerald-200/80 shadow-lg",
  red: "bg-red-600 ring-2 ring-red-300/80 shadow-lg",
};

const LONG_PRESS_MS = 550;

type Props = {
  images: VenueMapImageRow[];
  initialMarkers: VenueMarkerRow[];
  isAdmin: boolean;
};

function pctFromElement(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  const leftPct = ((clientX - r.left) / r.width) * 100;
  const topPct = ((clientY - r.top) / r.height) * 100;
  return {
    leftPct: Math.min(100, Math.max(0, leftPct)),
    topPct: Math.min(100, Math.max(0, topPct)),
  };
}

export function VenueMapClient({ images, initialMarkers, isAdmin }: Props) {
  const [markers, setMarkers] = useState<VenueMarkerRow[]>(initialMarkers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  useEffect(() => {
    setMarkers(initialMarkers);
  }, [initialMarkers]);

  const refresh = useCallback(async () => {
    const next = await fetchVenueMarkers();
    setMarkers(next);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null);
        setMoveTargetId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onLayerClick(e: React.MouseEvent<HTMLDivElement>, imageId: string) {
    if (!isAdmin) return;
    if (pendingId === "__add__") return;
    const layer = e.currentTarget;
    const p = pctFromElement(layer, e.clientX, e.clientY);
    if (!p) return;

    if (moveTargetId) {
      const marker = markers.find((m) => m.id === moveTargetId);
      if (!marker || marker.venue_map_image_id !== imageId) {
        setHint("Кликните по тому же слою карты, где находится маркер.");
        return;
      }
      setPendingId(moveTargetId);
      setHint(null);
      const res = await adminUpdateVenueMarkerPosition(moveTargetId, p.leftPct, p.topPct);
      setPendingId(null);
      setMoveTargetId(null);
      if ("error" in res && res.error) {
        setHint(res.error);
        return;
      }
      await refresh();
      return;
    }

    setPendingId("__add__");
    setHint(null);
    const res = await adminAddVenueMarker(imageId, p.leftPct, p.topPct);
    setPendingId(null);
    if ("error" in res && res.error) {
      setHint(res.error);
      return;
    }
    await refresh();
  }

  function clearPressTimer() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  function onMarkerPointerDown(e: React.PointerEvent, _id: string) {
    if (!isAdmin) return;
    e.stopPropagation();
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setMenu({ id: _id, x: e.clientX, y: e.clientY });
      pressTimerRef.current = null;
    }, LONG_PRESS_MS);
  }

  async function onMarkerPointerUp(e: React.PointerEvent, id: string) {
    if (!isAdmin) return;
    e.stopPropagation();
    clearPressTimer();
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    setPendingId(id);
    setHint(null);
    const res = await adminCycleVenueMarkerColor(id);
    setPendingId(null);
    if ("error" in res && res.error) {
      setHint(res.error);
      return;
    }
    await refresh();
  }

  function onMarkerPointerCancel() {
    clearPressTimer();
  }

  async function onDeleteFromMenu(id: string) {
    setMenu(null);
    setPendingId(id);
    setHint(null);
    const res = await adminDeleteVenueMarker(id);
    setPendingId(null);
    if ("error" in res && res.error) {
      setHint(res.error);
      return;
    }
    if (moveTargetId === id) setMoveTargetId(null);
    await refresh();
  }

  function onMoveFromMenu(id: string) {
    setMenu(null);
    setMoveTargetId(id);
    setHint(null);
  }

  const menuStyle = menu
    ? (() => {
        const pad = 8;
        const mw = 160;
        const mh = 88;
        const vw = typeof window !== "undefined" ? window.innerWidth : menu.x + mw;
        const vh = typeof window !== "undefined" ? window.innerHeight : menu.y + mh;
        const left = Math.min(menu.x, vw - mw - pad);
        const top = Math.min(menu.y, vh - mh - pad);
        return { left, top };
      })()
    : { left: 0, top: 0 };

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));

  return (
    <div className="space-y-4">
      {isAdmin && <VenueMapImagesAdmin images={images} />}

      {moveTargetId && isAdmin && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/35 px-3 py-2 text-sm text-amber-100/95">
          <span>Укажите новое место на том же слое карты (клик по плану).</span>
          <button
            type="button"
            className="rounded-md border border-amber-500/50 bg-amber-950/60 px-2 py-1 text-xs hover:bg-amber-900/70"
            onClick={() => setMoveTargetId(null)}
          >
            Отмена
          </button>
        </div>
      )}

      {sortedImages.length === 0 ? (
        <p className="rounded-lg border border-amber-700/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
          Нет слоёв карты. Примените миграцию БД и при необходимости загрузите изображения (администратор).
        </p>
      ) : (
        <div className="space-y-8">
          {sortedImages.map((img, layerIdx) => (
            <div key={img.id} className="space-y-2">
              {sortedImages.length > 1 && (
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Слой {layerIdx + 1}
                </p>
              )}
              <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
                <div
                  className={`relative block w-full p-0 text-left ${isAdmin ? "cursor-crosshair" : ""}`}
                  onClick={isAdmin ? (e) => void onLayerClick(e, img.id) : undefined}
                  role={isAdmin ? "application" : undefined}
                  aria-label={
                    isAdmin ? `Карта полигона: слой ${layerIdx + 1}, клик для маркера` : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.public_url}
                    alt={`План полигона, слой ${layerIdx + 1}`}
                    className="pointer-events-none h-auto w-full select-none"
                    draggable={false}
                  />

                  {markers
                    .filter((m) => m.venue_map_image_id === img.id)
                    .map((m) => {
                      const c = m.color;
                      const common = `absolute box-border rounded-sm transition-transform touch-manipulation select-none ${COLOR_CLASS[c]} ${
                        pendingId === m.id ? "opacity-70" : ""
                      }`;
                      const style = {
                        left: `${m.left_pct}%`,
                        top: `${m.top_pct}%`,
                        width: `${m.size_pct}%`,
                        aspectRatio: "1" as const,
                        transform: "translate(-50%, -50%)",
                      };
                      const numLabel = `${m.displayNum}`;
                      if (isAdmin) {
                        return (
                          <span
                            key={m.id}
                            role="presentation"
                            className={`${common} cursor-pointer hover:scale-110 hover:brightness-110 active:scale-95`}
                            style={style}
                            title={`Индикатор ${numLabel}`}
                            onPointerDown={(e) => onMarkerPointerDown(e, m.id)}
                            onPointerUp={(e) => onMarkerPointerUp(e, m.id)}
                            onPointerCancel={onMarkerPointerCancel}
                            onPointerLeave={onMarkerPointerCancel}
                            onClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(8px,1.6vw,13px)] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                              {numLabel}
                            </span>
                          </span>
                        );
                      }
                      return (
                        <span
                          key={m.id}
                          title={`Индикатор ${numLabel}`}
                          className={`${common} pointer-events-none`}
                          style={style}
                          role="img"
                          aria-label={`Индикатор ${numLabel}`}
                        >
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(8px,1.6vw,13px)] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {numLabel}
                          </span>
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {menu && isAdmin && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Закрыть меню"
            onClick={() => setMenu(null)}
          />
          <div
            className="fixed z-50 min-w-[10rem] overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-950 py-1 shadow-xl"
            style={{ left: menuStyle.left, top: menuStyle.top }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm hover:bg-white/10"
              onClick={() => onMoveFromMenu(menu.id)}
            >
              Переместить
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10"
              onClick={() => void onDeleteFromMenu(menu.id)}
            >
              Удалить
            </button>
          </div>
        </>
      )}

      {isAdmin && (
        <p className="text-sm text-[var(--muted)]">
          Клик по карте на нужном слое — новый индикатор (номер по порядку добавления по всей карте). Короткое нажатие на
          квадрат: <span className="text-zinc-400">серый</span> →{" "}
          <span className="text-emerald-400">зелёный</span> → <span className="text-red-400">красный</span>. Удерживайте
          квадрат — меню «Переместить» / «Удалить». Изменения видят все (~2,5 с).
        </p>
      )}
      {!isAdmin && (
        <p className="text-sm text-[var(--muted)]">Индикаторы обновляются автоматически. Расстановку задаёт администратор.</p>
      )}
      {hint && <p className="text-sm text-red-400">{hint}</p>}
    </div>
  );
}
