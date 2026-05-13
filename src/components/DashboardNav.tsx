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
    <nav className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.Icon;
        return (
        <Link
          key={item.href}
          href={item.href}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:border-[var(--border-glow)] hover:shadow-[0_0_40px_-8px_rgba(45,212,191,0.22)]"
        >
          <span
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl transition-opacity group-hover:opacity-100"
            aria-hidden
          />
          <div className="relative flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-teal-400/95 shadow-inner shadow-black/40 transition-colors group-hover:border-teal-400/35 group-hover:bg-teal-500/10 group-hover:text-teal-300">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-[var(--text)] transition-colors group-hover:text-teal-100">
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
