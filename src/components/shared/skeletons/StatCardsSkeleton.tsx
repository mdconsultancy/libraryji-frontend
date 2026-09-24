import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardsSkeletonProps {
  count?: number;
  /** Grid classes, e.g. "grid-cols-2 md:grid-cols-4". */
  className?: string;
}

/** Placeholder for a row of icon + label + number stat cards. */
export default function StatCardsSkeleton({ count = 4, className = "grid-cols-2 md:grid-cols-4" }: StatCardsSkeletonProps) {
  return (
    <div className={cn("grid gap-3", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-white dark:bg-darkgray p-3 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
