import { Skeleton } from "@/components/ui/misc";

export default function WishlistLoading() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8" aria-busy="true" aria-label="Loading wishlist">
      <div className="grid gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-6 w-40 rounded-md" />
      </div>
      <Skeleton className="h-10 w-36" />
      <div className="grid gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
