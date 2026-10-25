import { Skeleton } from "@/components/ui/misc";

export default function EventsLoading() {
  return (
    <div className="grid gap-12" aria-busy="true" aria-label="Loading your exchanges">
      <div className="flex items-end justify-between gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-12 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-6 rounded-3xl bg-card p-4 shadow-sm sm:p-6">
            <div className="flex gap-4">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
