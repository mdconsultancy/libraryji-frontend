import { Skeleton } from "@/components/ui/skeleton";
import CardBox from "@/app/components/shared/CardBox";

/** Loading placeholder shaped like the dashboard grid (big chart + stat cards + table + side list). */
export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-30">
      <div className="lg:col-span-8 col-span-12">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs h-full">
          <Skeleton className="h-5 w-40 mb-6" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardBox>
      </div>
      <div className="lg:col-span-4 col-span-12">
        <div className="grid grid-cols-12 h-full items-stretch gap-y-30">
          <div className="col-span-12">
            <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
              <Skeleton className="h-10 w-10 rounded-md mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </CardBox>
          </div>
          <div className="col-span-12">
            <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
              <Skeleton className="h-10 w-10 rounded-md mb-4" />
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardBox>
          </div>
        </div>
      </div>
      <div className="lg:col-span-8 col-span-12">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <Skeleton className="h-5 w-32 mb-6" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-1.5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardBox>
      </div>
      <div className="lg:col-span-4 col-span-12">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs h-full">
          <Skeleton className="h-5 w-32 mb-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 mb-6">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardBox>
      </div>
    </div>
  );
}
