import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { event, user } from "@/db/schema";
import { budgetLabel, longDateLabel } from "@/lib/format";
import { OgGift, OgSnow, ogColors, ogSize } from "@/lib/og";

export const alt = "You're invited to a Secret Santa on Giftr";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [row] = await db
    .select({ event, organizerName: user.name })
    .from(event)
    .innerJoin(user, eq(user.id, event.organizerId))
    .where(eq(event.inviteCode, code))
    .limit(1);

  const name = row?.event.name ?? "A Secret Santa exchange";
  const organizer = row?.organizerName ?? "Someone";
  const date = row ? longDateLabel(row.event.exchangeDate) : "";
  const budget = row ? budgetLabel(row.event.budgetMin, row.event.budgetMax, row.event.currency) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: ogColors.paper, fontFamily: "sans-serif" }}>
        <div
          style={{
            width: 400,
            height: "100%",
            background: ogColors.berry,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <OgSnow />
          <div style={{ position: "absolute", left: 184, top: 0, bottom: 0, width: 32, background: ogColors.gold }} />
          <div
            style={{
              width: 176,
              height: 176,
              borderRadius: 48,
              background: ogColors.cream,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <OgGift size={120} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px" }}>
          <div style={{ fontSize: 28, color: ogColors.muted }}>{organizer} invited you to</div>
          <div
            style={{ fontSize: 68, fontWeight: 700, color: ogColors.ink, lineHeight: 1.05, letterSpacing: -2, marginTop: 16 }}
          >
            {name}
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 32, fontSize: 30, color: ogColors.berry }}>
            {date ? <span>{date}</span> : null}
            {budget ? <span>· {budget}</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 48 }}>
            <OgGift size={40} />
            <div style={{ fontSize: 30, color: ogColors.ink, fontWeight: 700 }}>Giftr</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
