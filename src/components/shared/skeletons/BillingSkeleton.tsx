import { Skeleton } from "@/components/ui/skeleton";
import CardGridSkeleton from "./CardGridSkeleton";

/** Placeholder for the "My Subscription & Plan" page: current-plan card, plan grid, payment history. */
export default function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="rounded-xl bg-white dark:bg-darkgray p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="flex flex-col items-end gap-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-3 w-3/4 mt-5" />
      </div>

      <div className="rounded-xl bg-white dark:bg-darkgray p-6 shadow-xs">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-3.5 w-72 mb-6" />
        <CardGridSkeleton count={3} className="grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto" />
      </div>

      <div className="rounded-xl bg-white dark:bg-darkgray p-6 shadow-xs">
        <Skeleton className="h-5 w-40 mb-5" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 md:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className={`h-4 ${j > 3 ? "hidden md:block" : ""}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
