import { Skeleton } from "@/components/ui/misc";

export default function WishlistLoading() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8" aria-busy="true" aria-label="Loading wishlist">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-56" />
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
