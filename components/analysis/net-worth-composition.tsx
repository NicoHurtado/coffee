"use client";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { endOfMonth, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const TYPE_COLORS = {
  debit: "#16c784", // emerald (liquidez)
  fixed_income: "#4f9bb0", // steel blue (renta fija)
  investment: "#c79a4b", // muted amber (inversión)
  credit: "#ea3943", // strong red (deuda)
} as const;

const config = {
  debit: { label: "Débito", color: TYPE_COLORS.debit },
  fixed_income: { label: "Renta Fija", color: TYPE_COLORS.fixed_income },
  investment: { label: "Inversiones", color: TYPE_COLORS.investment },
  credit: { label: "Crédito", color: TYPE_COLORS.credit },
} satisfies ChartConfig;

const RANGES = [
  { key: "6m", months: 6, label: "6m" },
  { key: "1y", months: 12, label: "1a" },
  { key: "2y", months: 24, label: "2a" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

export function NetWorthComposition() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const [range, setRange] = useState<RangeKey>("1y");

  const data = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!;
    const out: {
      label: string;
      debit: number;
      fixed_income: number;
      investment: number;
      credit: number;
    }[] = [];
    for (let i = cfg.months - 1; i >= 0; i--) {
      const d = endOfMonth(subMonths(new Date(), i));
      const txsUntil = txs.filter((t) => new Date(t.occurredAt) <= d);
      let debit = 0;
      let fixed_income = 0;
      let investment = 0;
      let credit = 0;
      accounts.forEach((a) => {
        const bal = computeAccountBalance(a, txsUntil, d);
        if (a.type === "debit") debit += Math.max(0, bal);
        else if (a.type === "fixed_income") fixed_income += Math.max(0, bal);
        else if (a.type === "investment") investment += Math.max(0, bal);
        else if (a.type === "credit") credit += Math.max(0, bal);
      });
      out.push({
        label: format(d, cfg.months > 12 ? "MMM yy" : "MMM", { locale: es }),
        debit,
        fixed_income,
        investment,
        credit: -credit, // show as negative (below axis)
      });
    }
    return out;
  }, [accounts, txs, range]);

  const latest = data[data.length - 1];
  const assets = latest
    ? latest.debit + latest.fixed_income + latest.investment
    : 0;
  const liabilities = latest ? Math.abs(latest.credit) : 0;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Composición del patrimonio
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Activos: <span className="font-semibold text-foreground tabular-nums">{formatMoney(assets, currency)}</span>
            {liabilities > 0 && (
              <>
                {" · "}
                Deuda:{" "}
                <span className="font-semibold text-destructive tabular-nums">
                  {formatMoney(liabilities, currency)}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition",
                range === r.key
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ChartContainer config={config} className="h-72 w-full">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            minTickGap={20}
          />
          <YAxis hide />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(v) => formatMoney(Math.abs(Number(v)), currency)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="debit"
            stackId="assets"
            stroke="var(--color-debit)"
            fill="var(--color-debit)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="fixed_income"
            stackId="assets"
            stroke="var(--color-fixed_income)"
            fill="var(--color-fixed_income)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="investment"
            stackId="assets"
            stroke="var(--color-investment)"
            fill="var(--color-investment)"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="credit"
            stackId="debt"
            stroke="var(--color-credit)"
            fill="var(--color-credit)"
            fillOpacity={0.4}
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex flex-wrap gap-3 text-xs">
        {(["debit", "fixed_income", "investment", "credit"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: TYPE_COLORS[k] }}
            />
            <span className="text-muted-foreground">{config[k].label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
