import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
        secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        outline: "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
        neon: "bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
