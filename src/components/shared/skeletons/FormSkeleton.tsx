import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FormSkeletonProps {
  fields?: number;
  /** Two-column field grid on wide screens. */
  columns?: 1 | 2;
  /** Tab strip above the form (settings pages). */
  tabs?: number;
  /** Wrap in the standard white card. */
  card?: boolean;
  className?: string;
}

/** Placeholder for settings/profile style pages: optional tab strip + label/input pairs + a save button. */
export default function FormSkeleton({ fields = 6, columns = 2, tabs = 0, card = true, className }: FormSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-busy="true" aria-label="Loading">
      {tabs > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      )}
      <div className={cn(card && "rounded-xl bg-white dark:bg-darkgray p-6 shadow-xs")}>
        <Skeleton className="h-5 w-48 mb-6" />
        <div className={cn("grid grid-cols-1 gap-5", columns === 2 && "md:grid-cols-2")}>
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32 rounded-md mt-6" />
      </div>
    </div>
  );
}
