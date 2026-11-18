"use client";

import { useLayoutEffect } from "react";
import { applyFestivity, readFestivity, subscribeFestivity } from "@/components/festivity";

/** Keeps `data-festivity` aligned with storage after hydration and across tabs. */
export function FestivityProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const sync = () => applyFestivity(readFestivity());
    sync();
    return subscribeFestivity(sync);
  }, []);
  return children;
}
