"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { runAction } from "@/lib/action";
import { HOLIDAY_COOKIE, type Holiday } from "@/lib/holiday";

const holidaySchema = z.enum(["christmas", "hanukkah"]);

export async function setHoliday(holiday: Holiday) {
  return runAction(async () => {
    const value = holidaySchema.parse(holiday);
    const jar = await cookies();
    jar.set(HOLIDAY_COOKIE, value, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
  });
}
