"use client";
import dynamic from "next/dynamic";

// recharts is heavy (~hundreds of KB). Loading the chart with ssr:false keeps it
// out of the home route's initial JS bundle — the rest of the dashboard hydrates
// and paints first, then the chart streams in. A skeleton holds its layout so
// nothing shifts when it arrives.
const NetWorthChart = dynamic(
  () => import("./net-worth-chart").then((m) => m.NetWorthChart),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-7 w-40 rounded bg-muted animate-pulse" />
        <div className="h-56 w-full rounded bg-muted/60 animate-pulse" />
      </section>
    ),
  },
);

export function NetWorthChartLazy() {
  return <NetWorthChart />;
}
