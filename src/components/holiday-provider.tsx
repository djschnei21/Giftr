"use client";

import { createContext, useContext } from "react";
import type { Holiday } from "@/lib/holiday";

const HolidayContext = createContext<Holiday>("christmas");

export function HolidayProvider({ value, children }: { value: Holiday; children: React.ReactNode }) {
  return <HolidayContext.Provider value={value}>{children}</HolidayContext.Provider>;
}

export function useHoliday() {
  return useContext(HolidayContext);
}
