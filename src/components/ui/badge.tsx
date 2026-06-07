import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "outline" | "destructive";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "badge",
        {
          "bg-[var(--color-accent-muted)] text-[var(--color-accent-hover)] border-[var(--color-accent)]/20":
            variant === "default",
          "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]":
            variant === "secondary",
          "bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)]":
            variant === "outline",
          "bg-red-500/15 text-red-400 border-red-500/20":
            variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
