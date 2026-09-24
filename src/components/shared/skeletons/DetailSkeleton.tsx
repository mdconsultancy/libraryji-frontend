import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DetailSkeletonProps {
  /** Label/value rows under the header. */
  rows?: number;
  /** Avatar + name header (profile/detail views). */
  header?: boolean;
  className?: string;
}

/** Placeholder for detail panels: an avatar/title header followed by label → value rows (user details, receipts, subscription cards). */
export default function DetailSkeleton({ rows = 5, header = true, className }: DetailSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)} aria-busy="true" aria-label="Loading">
      {header && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
