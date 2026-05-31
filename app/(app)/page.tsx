import { Greeting } from "@/components/home/greeting";
import { NetWorth } from "@/components/home/net-worth";
import { NetWorthChart } from "@/components/home/net-worth-chart";
import { ExpensesBreakdown } from "@/components/home/expenses-breakdown";
import { AccountsSlider } from "@/components/accounts/accounts-slider";
import { AccountsGrid } from "@/components/accounts/accounts-grid";
import { RecentActivity } from "@/components/home/recent-activity";
import { AddTransactionButton } from "@/components/nav/add-transaction-button";
import { HomeKpis } from "@/components/home/home-kpis";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { LogoutButton } from "@/components/nav/logout-button";

export default function HomePage() {
  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="md:hidden p-4 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <Greeting />
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <NetWorth />
        <AccountsSlider />
        <NetWorthChart />
        <ExpensesBreakdown />
        <RecentActivity />
      </div>

      {/* DESKTOP DASHBOARD */}
      <div className="hidden md:block p-6 lg:p-8 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <Greeting />
          <AddTransactionButton />
        </div>

        <HomeKpis />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <NetWorthChart />
            <ExpensesBreakdown />
          </div>
          <div className="col-span-12 xl:col-span-4">
            <div className="rounded-2xl border bg-card p-5 h-full">
              <RecentActivity limit={7} />
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Mis cuentas</h2>
          </div>
          <AccountsGrid />
        </section>
      </div>
    </>
  );
}
