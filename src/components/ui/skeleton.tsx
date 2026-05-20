import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
