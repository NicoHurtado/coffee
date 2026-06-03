"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-0.5 w-full items-center overflow-x-hidden rounded-full bg-muted ring-1 ring-inset ring-border",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 transition-all rounded-full"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: "var(--progress-color, var(--primary))",
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
