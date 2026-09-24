import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  rows?: number;
  /** Round avatar/icon on the left of each row. */
  avatar?: boolean;
  /** Small element on the right (badge, time, checkbox…). */
  trailing?: boolean;
  /** Render each row as its own card (mobile card lists) instead of a plain stacked list. */
  card?: boolean;
  className?: string;
}

/** Placeholder for avatar + two-line rows: activity feeds, rosters, ledgers, staff lists, mobile card lists. */
export default function ListSkeleton({ rows = 5, avatar = true, trailing = true, card = false, className }: ListSkeletonProps) {
  return (
    <div className={cn("flex flex-col", card ? "gap-3" : "gap-4", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn("flex items-center gap-3", card && "rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs")}
        >
          {avatar && <Skeleton className={cn("shrink-0 rounded-full", card ? "h-12 w-12" : "h-9 w-9")} />}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5 max-w-48" />
            <Skeleton className="h-3 w-3/5 max-w-72" />
          </div>
          {trailing && <Skeleton className="h-5 w-14 shrink-0 rounded-full" />}
        </div>
      ))}
    </div>
  );
}
