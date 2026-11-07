import { ChristmasTree, GiftStack, HollyDivider } from "@/components/festive";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-3xl bg-card px-6 py-16 text-center shadow-sm ring-1 ring-border/70",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-14 -rotate-3 items-center justify-center rounded-2xl bg-accent text-accent-foreground [&_svg]:size-6">
          {icon}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <ChristmasTree className="h-32" />
          <GiftStack className="h-20" />
        </div>
      )}
      <div className="grid max-w-sm justify-items-center gap-2">
        <h2 className="font-display text-3xl">{title}</h2>
        {icon ? null : <HollyDivider className="max-w-48" />}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
