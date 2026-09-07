"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, Wallet, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui";

const LEFT = [
  { href: "/", label: "Home", icon: Home },
  { href: "/historial", label: "Historial", icon: ListOrdered },
];
const RIGHT = [
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/metas", label: "Metas", icon: Target },
];

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-medium tracking-[-0.01em] flex-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  return (
    <nav
      className="md:hidden fixed inset-x-3 z-40"
      style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <div className="glass relative flex h-16 items-center rounded-[26px] border px-1">
        {LEFT.map((it) => (
          <NavLink
            key={it.href}
            href={it.href}
            label={it.label}
            Icon={it.icon}
            active={it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)}
          />
        ))}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            aria-label="Añadir transacción"
            onClick={() => openQuickAdd()}
            className="absolute -top-6 left-1/2 -translate-x-1/2 size-14 rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_var(--primary)] ring-4 ring-background/70 flex items-center justify-center active:scale-95 transition"
          >
            <Plus className="size-6" />
          </button>
        </div>
        {RIGHT.map((it) => (
          <NavLink
            key={it.href}
            href={it.href}
            label={it.label}
            Icon={it.icon}
            active={pathname.startsWith(it.href)}
          />
        ))}
      </div>
    </nav>
  );
}
