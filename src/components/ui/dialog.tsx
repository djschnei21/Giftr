"use client";

import * as React from "react";
import { Dialog as DialogPrimitive, AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Drawer as DrawerPrimitive } from "vaul";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

const overlayClass =
  "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0";
const contentClass =
  "fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

/**
 * Dialog on desktop, bottom sheet on phones. Same API either way.
 */
type ResponsiveDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function ResponsiveDialog({ open, onOpenChange, trigger, title, description, children, className }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={overlayClass} />
          <DialogPrimitive.Content className={cn(contentClass, className)}>
            <div className="grid gap-1.5 pr-8">
              <DialogPrimitive.Title className="font-display text-xl font-semibold">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            {children}
            <DialogPrimitive.Close className="absolute top-5 right-5 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      {trigger ? <DrawerPrimitive.Trigger asChild>{trigger}</DrawerPrimitive.Trigger> : null}
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border-t bg-card outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
          <div className="grid gap-1.5 px-5 pt-4">
            <DrawerPrimitive.Title className="font-display text-xl font-semibold">{title}</DrawerPrimitive.Title>
            <DrawerPrimitive.Description className={description ? "text-sm text-muted-foreground" : "sr-only"}>
              {description ?? title}
            </DrawerPrimitive.Description>
          </div>
          <div className="pb-safe grid gap-5 overflow-y-auto px-5 pt-5">{children}</div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

type ConfirmProps = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

function ConfirmDialog({ trigger, open, onOpenChange, title, description, confirmLabel, destructive, onConfirm }: ConfirmProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger> : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlayClass} />
        <AlertDialogPrimitive.Content className={cn(contentClass, "max-w-md")}>
          <div className="grid gap-2">
            <AlertDialogPrimitive.Title className="font-display text-xl font-semibold">{title}</AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: "outline" })}>Cancel</AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              className={buttonVariants({ variant: destructive ? "destructive" : "default" })}
              onClick={() => void onConfirm()}
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { ResponsiveDialog, ConfirmDialog };
