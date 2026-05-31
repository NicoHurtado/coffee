"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const trmDate = useExchangeRateStore((s) => s.trmDate);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-card h-screen sticky top-0 p-4 gap-1">
      <div className="px-3 py-5 flex items-center gap-2">
        <img src="/cafe.svg" alt="FinancePro" className="size-8 object-contain" />
        <span className="font-semibold text-lg">Coffee</span>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </div>
      {usdToCop && (
        <div className="px-3 py-1.5 flex flex-col gap-0.5" title={trmDate ? `TRM vigente ${trmDate}` : undefined}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">TRM</span>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              ${Math.round(usdToCop).toLocaleString("es-CO")}
            </span>
          </div>
          {trmDate && (
            <span className="text-[9px] text-muted-foreground/60 tabular-nums">
              Vigente {trmDate.slice(8, 10)}/{trmDate.slice(5, 7)}/{trmDate.slice(0, 4)}
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
