"use client";
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";
import type { Account, CardNetwork } from "@/lib/types";

const NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  other: "Otra",
};

const TYPE_LABEL: Record<Account["type"], string> = {
  debit: "Débito",
  credit: "Crédito",
  fixed_income: "Renta Fija",
  investment: "Inversión",
};

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right truncate max-w-[60%]">
        {String(value)}
      </span>
    </div>
  );
}

export function CardInfo({ account }: { account: Account }) {
  const userName = useSettingsStore((s) => s.userName);
  const isCredit = account.type === "credit";
  const isDebit = account.type === "debit";
  const network = (isCredit ? account.network : isDebit ? account.network : undefined) as
    | CardNetwork
    | undefined;
  const last4 = isCredit ? account.last4 : isDebit ? account.last4 : undefined;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        Información
      </div>
      <Row label="Tipo" value={TYPE_LABEL[account.type]} />
      <Row label="Nombre" value={account.name} />
      <Row label="Entidad" value={account.institution} />
      <Row label="Titular" value={userName} />
      <Row label="Marca" value={network ? NETWORK_LABEL[network] : undefined} />
      <Row label="Últimos 4" value={last4 ? `•••• ${last4}` : undefined} />
      {isCredit && (
        <>
          <Row label="Cupo" value={formatMoney(account.creditLimit, account.currency)} />
          <Row label="Vencimiento" value={account.expDate} />
        </>
      )}
      {account.type === "fixed_income" && (
        <>
          <Row label="Tasa anual" value={`${account.annualRate}%`} />
          <Row label="Fecha inicio" value={account.startDate} />
          {account.maturityDate && <Row label="Vence" value={account.maturityDate} />}
        </>
      )}
      <Row label="Moneda" value={account.currency} />
    </div>
  );
}
