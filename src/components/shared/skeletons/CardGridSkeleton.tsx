import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardGridSkeletonProps {
  count?: number;
  /** Grid classes, e.g. "grid-cols-1 md:grid-cols-3". */
  className?: string;
  /** "plan" = pricing card (title, price, feature list, button); "tile" = small square tile (seats). */
  variant?: "plan" | "tile";
}

/** Placeholder grid for pricing/plan cards and seat tiles. */
export default function CardGridSkeleton({ count = 3, className, variant = "plan" }: CardGridSkeletonProps) {
  if (variant === "tile") {
    return (
      <div className={cn("grid gap-3", className)} aria-busy="true" aria-label="Loading">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white dark:bg-darkgray p-3 flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white dark:bg-darkgray p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-9 w-1/3 mt-2" />
          <div className="flex flex-col gap-3 mt-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-3 flex-1" style={{ maxWidth: `${85 - j * 8}%` }} />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-md mt-4" />
        </div>
      ))}
    </div>
  );
}
