import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading">
      <div className="grid gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-12 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <div className="grid content-start gap-6">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
