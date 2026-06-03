import { cn } from "@/lib/utils";

/**
 * Administrative page header: mono uppercase eyebrow + title, optional subtitle,
 * and a right-aligned actions slot. Used across all top-level pages so the
 * "trading desk" header language stays consistent.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 flex-wrap border-b pb-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

/** Mono uppercase section label with a hairline underline. */
export function SectionHeading({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b pb-2",
        className,
      )}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}
