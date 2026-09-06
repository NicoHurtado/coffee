import type { ReactNode } from "react";
import { formatMoney } from "@/lib/finance/format";
import type { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

/*
 * Iconos de Phosphor Icons (MIT) — https://phosphoricons.com
 * `piggy-bank-duotone` y `chart-line-up-duotone`, copiados tal cual para no
 * agregar una dependencia. La capa con opacidad .2 es el relleno duotono.
 */

export function PiggyBankIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <g fill="currentColor">
        <path
          opacity=".2"
          d="M240 112v32a16 16 0 0 1-16 16h-8l-18.1 50.69a8 8 0 0 1-7.54 5.31h-12.72a8 8 0 0 1-7.54-5.31L166.29 200H97.71l-3.81 10.69a8 8 0 0 1-7.54 5.31H73.64a8 8 0 0 1-7.54-5.31L53 174a79.7 79.7 0 0 1-21-54a80 80 0 0 1 80-80h32a80 80 0 0 1 73.44 48.22a82 82 0 0 1 2.9 7.78H224a16 16 0 0 1 16 16"
        />
        <path d="M192 116a12 12 0 1 1-12-12a12 12 0 0 1 12 12m-40-52h-40a8 8 0 0 0 0 16h40a8 8 0 0 0 0-16m96 48v32a24 24 0 0 1-24 24h-2.36l-16.21 45.38A16 16 0 0 1 190.36 224h-12.72a16 16 0 0 1-15.07-10.62l-1.92-5.38h-57.3l-1.92 5.38A16 16 0 0 1 86.36 224H73.64a16 16 0 0 1-15.07-10.62L46 178.22a87.7 87.7 0 0 1-21.44-48.38A16 16 0 0 0 16 144a8 8 0 0 1-16 0a32 32 0 0 1 24.28-31A88.12 88.12 0 0 1 112 32h104a8 8 0 0 1 0 16h-21.39a87.93 87.93 0 0 1 30.17 37c.43 1 .85 2 1.25 3A24 24 0 0 1 248 112m-16 0a8 8 0 0 0-8-8h-3.66a8 8 0 0 1-7.64-5.6A71.9 71.9 0 0 0 144 48h-32a72 72 0 0 0-53.09 120.64a8 8 0 0 1 1.64 2.71L73.64 208h12.72l3.82-10.69a8 8 0 0 1 7.53-5.31h68.58a8 8 0 0 1 7.53 5.31l3.82 10.69h12.72l18.11-50.69A8 8 0 0 1 216 152h8a8 8 0 0 0 8-8Z" />
      </g>
    </svg>
  );
}

export function ChartLineUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <g fill="currentColor">
        <path opacity=".2" d="M224 64v144H32V48h176a16 16 0 0 1 16 16" />
        <path d="M232 208a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v108.69l50.34-50.35a8 8 0 0 1 11.32 0L128 132.69L180.69 80H160a8 8 0 0 1 0-16h40a8 8 0 0 1 8 8v40a8 8 0 0 1-16 0V91.31l-58.34 58.35a8 8 0 0 1-11.32 0L96 123.31l-56 56V200h184a8 8 0 0 1 8 8" />
      </g>
    </svg>
  );
}

/** El ícono que le toca a cada producto que no es tarjeta. */
export function savingsIcon(type: "fixed_income" | "investment", className?: string): ReactNode {
  return type === "investment" ? (
    <ChartLineUpIcon className={className} />
  ) : (
    <PiggyBankIcon className={className} />
  );
}

/**
 * Renta fija e inversiones: no son plástico, así que en vez del frente de una
 * tarjeta llevan el ícono del producto en una pastilla junto al nombre, con el
 * balance solo. Mide igual que una tarjeta para que la fila siga pareja.
 */
export function SavingsFace({
  type,
  name,
  subtitle,
  balance,
  currency,
  className,
}: {
  type: "fixed_income" | "investment";
  name: string;
  subtitle: string;
  balance: number;
  currency: Currency;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full min-h-[160px] overflow-hidden rounded-xl border border-border/60 bg-card p-5",
        "flex flex-col justify-between gap-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {savingsIcon(type, "size-6")}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold leading-5">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">BALANCE</div>
        <div className="mt-1 truncate text-2xl font-semibold tabular-nums">
          {formatMoney(balance, currency)}
        </div>
      </div>
    </div>
  );
}
