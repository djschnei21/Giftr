import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { HOLIDAY_COOKIE, parseHoliday } from "@/lib/holiday";

export const getHoliday = cache(async () => parseHoliday((await cookies()).get(HOLIDAY_COOKIE)?.value));
