import { Skeleton } from "@/components/ui/misc";

export default function WishlistsLoading() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading wishlists">
      <div className="grid gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
