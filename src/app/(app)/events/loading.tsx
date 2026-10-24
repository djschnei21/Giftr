import { Skeleton } from "@/components/ui/misc";

export default function EventsLoading() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading your exchanges">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
