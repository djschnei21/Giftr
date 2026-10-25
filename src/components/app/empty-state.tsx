import { GiftStack } from "@/components/festive";
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
        "flex flex-col items-center gap-6 rounded-3xl bg-card px-6 py-16 text-center shadow-sm",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-14 -rotate-3 items-center justify-center rounded-2xl bg-accent text-accent-foreground [&_svg]:size-6">
          {icon}
        </div>
      ) : (
        <GiftStack />
      )}
      <div className="grid max-w-sm gap-2">
        <h2 className="font-display text-2xl">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
