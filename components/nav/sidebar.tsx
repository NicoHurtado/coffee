"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, Wallet, Target, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
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
    <aside className="hidden md:flex md:flex-col w-60 border-r bg-sidebar h-screen sticky top-0 p-3.5 gap-1">
      <div className="px-2.5 py-4 flex items-center">
        <span className="font-bold text-base tracking-tight">Coffee</span>
      </div>
      <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
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
                "relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-primary" />
              )}
              <Icon className={cn("size-4", active && "text-primary")} />
              {it.label}
            </Link>
          );
        })}
      </div>
      {usdToCop && (
        <div
          className="mt-1 flex items-center justify-between rounded-[10px] border bg-card px-3 py-2"
          title={trmDate ? `TRM vigente ${trmDate}` : undefined}
        >
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
      <div className="px-1 pb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <LogOut className="size-3.5" />
          Salir
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
