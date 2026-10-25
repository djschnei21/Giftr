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
          toast: "!rounded-2xl !border-0 !bg-card !font-sans !text-card-foreground !shadow-xl dark:!ring-1 dark:!ring-white/10",
          title: "!font-semibold",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
