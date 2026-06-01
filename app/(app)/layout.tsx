import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QuickAddPanel } from "@/components/transactions/quick-add-sheet";
import { DataHydrator } from "@/components/data-hydrator";
import { StoreSeeder, type InitialData } from "@/components/store-seeder";
import { getSession } from "@/lib/session";
import {
  getAccountsForUser,
  getCategories,
  getSettingsForUser,
  getTransactionsForUser,
} from "@/lib/db/queries";

// Fetch the user's data on the server, in parallel, so it ships embedded in the
// initial HTML. The client seeds its stores from this instead of firing a fetch
// waterfall after hydration. Returns null on any failure (e.g. DB unreachable);
// DataHydrator then self-heals via the API routes.
async function loadInitialData(): Promise<InitialData | null> {
  const session = await getSession();
  if (!session) return null;
  const uid = session.uid;
  try {
    const [accounts, transactions, settings, categories] = await Promise.all([
      getAccountsForUser(uid),
      getTransactionsForUser(uid),
      getSettingsForUser(uid),
      getCategories(),
    ]);
    return { accounts, transactions, settings, categories };
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const initial = await loadInitialData();

  return (
    <div className="min-h-screen flex">
      {initial && <StoreSeeder data={initial} />}
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
