"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border !border-border !bg-card !text-card-foreground !shadow-lg",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
