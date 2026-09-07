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
      className={cn("flex items-end justify-between gap-4 flex-wrap", className)}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && (
          <span className="text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] leading-tight">{title}</h1>
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
        "flex items-center justify-between gap-3 pb-1",
        className,
      )}
    >
      <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}
