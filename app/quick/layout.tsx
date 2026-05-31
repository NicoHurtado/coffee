import { DataHydrator } from "@/components/data-hydrator";

export default function QuickLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DataHydrator />
      {children}
    </>
  );
}
