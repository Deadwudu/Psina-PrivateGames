import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  IconChat,
  IconClipboard,
  IconCpu,
  IconDoor,
  IconKey,
  IconMapPin,
} from "@/components/NavIcons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const items: {
  href: string;
  label: string;
  desc: string;
  Icon: Icon;
}[] = [
  {
    href: "/dashboard/venue-map",
    label: "Карта полигона",
    desc: "План этажей и статусы точек",
    Icon: IconMapPin,
  },
  { href: "/dashboard/tasks", label: "Мои задачи", desc: "Назначенные задания", Icon: IconClipboard },
  { href: "/dashboard/rapport", label: "Рапорт по задаче", desc: "Задача, выполнение, комментарий", Icon: IconChat },
  { href: "/dashboard/door-hack", label: "Взлом двери", desc: "Мини-игра и отметка на карте", Icon: IconDoor },
  { href: "/dashboard/server-hack", label: "Взлом сервера", desc: "Четыре этапа мини-игры", Icon: IconCpu },
  {
    href: "/dashboard/decryption",
    label: "Дешифровка документов",
    desc: "Ввод ключа шифрования",
    Icon: IconKey,
  },
];

export function DashboardNav() {
  return (
    <nav className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative overflow-hidden rounded-sm border-2 border-[#454e3c]/90 bg-gradient-to-br from-[#1a2118]/95 to-[#0f140d]/98 p-5 shadow-lg shadow-black/40 transition-all duration-300 hover:border-[var(--border-glow)] hover:shadow-[0_0_36px_-10px_rgba(138,154,98,0.35)]"
          >
            <span
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#3d4d2f]/20 blur-2xl transition-opacity group-hover:opacity-100"
              aria-hidden
            />
            <div className="relative flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2 border-[#4f5844] bg-[#0f130d]/90 text-[var(--accent-dim)] shadow-inner shadow-black/50 transition-colors group-hover:border-[#6b7a52] group-hover:bg-[#1a2218] group-hover:text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display font-semibold uppercase tracking-wide text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">
                  {item.label}
                </span>
                <p className="mt-1 text-sm leading-snug text-[var(--muted)]">{item.desc}</p>
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
