import Link from "next/link";

const items = [
  { href: "/dashboard/tasks", label: "Мои задачи", desc: "Назначенные задания" },
  { href: "/dashboard/rapport", label: "Рапорт по задаче", desc: "Задача, выполнение, комментарий" },
  { href: "/dashboard/door-hack", label: "Взлом двери", desc: "Фиксация результата" },
  { href: "/dashboard/server-hack", label: "Взлом сервера", desc: "Четыре этапа мини-игры" },
  { href: "/dashboard/decryption", label: "Дешифровка документов", desc: "Ввод ключа шифрования" },
];

export function DashboardNav() {
  return (
    <nav className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 transition-colors hover:border-[var(--accent)] hover:bg-white/[0.03]"
        >
          <span className="font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
            {item.label}
          </span>
          <p className="mt-1 text-sm text-[var(--muted)]">{item.desc}</p>
        </Link>
      ))}
    </nav>
  );
}
