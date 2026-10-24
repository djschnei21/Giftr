import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
        <div className="grid content-start gap-6">
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
