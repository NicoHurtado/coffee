"use client";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTransactionsStore } from "@/lib/store/transactions";
import { formatMoney } from "@/lib/finance/format";
import type { InvestmentAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

const chartConfig = {
  value: { label: "Balance", color: "var(--primary)" },
} satisfies ChartConfig;

type Point = { ts: number; label: string; value: number };

/**
 * Movimiento del balance de la cuenta de inversión a lo largo del tiempo.
 * El balance de inversión equivale al último ajuste registrado, así que la
 * serie de ajustes (sincronizaciones de IBKR + actualizaciones manuales)
 * describe cómo sube o baja el balance: cuando se añade plata sube, y si en
 * una sincronización el precio bajó, baja.
 */
export function InvestmentBalanceChart({
  account,
}: {
  account: InvestmentAccount;
}) {
  const txs = useTransactionsStore((s) => s.forAccount(account.id));

  const data = useMemo<Point[]>(() => {
    const adjustments = txs
      .filter((t) => t.kind === "adjustment")
      .sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt));

    const points: Point[] = adjustments.map((t) => {
      const d = new Date(t.occurredAt);
      return {
        ts: d.getTime(),
        label: format(d, "d MMM", { locale: es }),
        value: t.amount,
      };
    });

    // Ancla con el balance inicial para dar contexto si hay pocos puntos.
    if (points.length < 2) {
      const created = new Date(account.createdAt);
      points.unshift({
        ts: created.getTime(),
        label: format(created, "d MMM", { locale: es }),
        value: account.initialBalance,
      });
    }
    return points;
  }, [txs, account.createdAt, account.initialBalance]);

  if (data.length < 2) return null;

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
  const up = delta >= 0;
  const stroke = up ? "#10b981" : "#ef4444";

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Movimiento del balance
          </div>
          <div className="text-xl font-semibold tabular-nums">
            {formatMoney(last, account.currency)}
          </div>
          <div className={cn("text-xs", up ? "text-emerald-600" : "text-red-500")}>
            {up ? "+" : "-"}
            {formatMoney(Math.abs(delta), account.currency)} (
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct.toFixed(1)}%)
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-56 w-full">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="invBalanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            minTickGap={32}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => {
              const d = props.payload?.[0]?.payload as Point | undefined;
              if (!d) return null;
              return (
                <div className="rounded-lg border bg-background shadow-md text-xs p-3 space-y-1">
                  <div className="font-medium">
                    {format(new Date(d.ts), "d MMM yyyy", { locale: es })}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(d.value, account.currency)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Balance"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#invBalanceFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
    </section>
  );
}
