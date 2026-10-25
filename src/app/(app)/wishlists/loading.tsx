import { Skeleton } from "@/components/ui/misc";

export default function WishlistsLoading() {
  return (
    <div className="grid gap-12" aria-busy="true" aria-label="Loading wishlists">
      <div className="flex items-end justify-between gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-6 rounded-3xl bg-card p-4 shadow-sm sm:p-6">
            <div className="grid gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
