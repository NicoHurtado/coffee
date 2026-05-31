import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QuickAddPanel } from "@/components/transactions/quick-add-sheet";
import { DataHydrator } from "@/components/data-hydrator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <DataHydrator />
      <Sidebar />
      <main className="flex-1 min-w-0 pt-[env(safe-area-inset-top)] pb-[calc(56px+env(safe-area-inset-bottom)+16px)] md:pt-0 md:pb-0 relative">
        {children}
      </main>
      <BottomNav />
      <QuickAddPanel />
    </div>
  );
}
