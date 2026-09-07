"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, Wallet, Target, BarChart3, LogOut, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/historial", label: "Historial", icon: ListOrdered },
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/analisis", label: "Análisis", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const trmDate = useExchangeRateStore((s) => s.trmDate);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full-page load so the next user can't inherit this user's in-memory stores.
    window.location.assign("/login");
  }

  return (
    <aside className="coffee-sidebar glass hidden md:flex md:flex-col w-60 border-r h-screen sticky top-0 p-3 gap-1">
      <div className="px-2 py-3 flex items-center gap-2.5">
        <span className="coffee-brand"><Coffee className="size-5" /></span>
        <span className="font-semibold text-[20px] tracking-[-0.03em]">Coffee</span>
      </div>
      <div className="px-3.5 pt-3 pb-1.5 text-[11px] font-medium tracking-[-0.005em] text-muted-foreground">
        General
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-colors",
                active
                  ? "coffee-nav-active"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {it.label}
            </Link>
          );
        })}
      </div>
      {usdToCop && (
        <div
          className="mt-1 flex items-center justify-between surface rounded-2xl px-3.5 py-3"
          title={trmDate ? `TRM vigente ${trmDate}` : undefined}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground">
              TRM
            </span>
            <span className="text-[13px] font-semibold tabular-nums">
              ${Math.round(usdToCop).toLocaleString("es-CO")}
            </span>
          </div>
          {trmDate && (
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {trmDate.slice(8, 10)}/{trmDate.slice(5, 7)}/{trmDate.slice(2, 4)}
            </span>
          )}
        </div>
      )}
      <div className="mt-1 pt-1 border-t">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <LogOut className="size-3.5" />
          Salir
        </button>
      </div>
    </aside>
  );
}
