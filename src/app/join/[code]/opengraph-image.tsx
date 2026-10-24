import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { event, user } from "@/db/schema";
import { budgetLabel, longDateLabel } from "@/lib/format";

export const alt = "You're invited to a Secret Santa on Giftr";
export const size = { width: 1200, height: 630 };
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
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f7f4ee", fontFamily: "sans-serif" }}>
        <div style={{ width: 380, height: "100%", background: "#1f5c45", display: "flex", position: "relative" }}>
          <div style={{ position: "absolute", left: 170, top: 0, bottom: 0, width: 40, background: "#a3253b" }} />
          <div style={{ position: "absolute", top: 295, left: 0, right: 0, height: 40, background: "#a3253b" }} />
          <div
            style={{
              position: "absolute",
              top: 235,
              left: 110,
              width: 160,
              height: 160,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 84,
            }}
          >
            🎁
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px" }}>
          <div style={{ fontSize: 28, color: "#756d63", textTransform: "uppercase", letterSpacing: 2 }}>
            {organizer} invited you to
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, color: "#26221d", lineHeight: 1.08, marginTop: 16 }}>{name}</div>
          <div style={{ display: "flex", gap: 24, marginTop: 36, fontSize: 30, color: "#1f5c45" }}>
            {date ? <span>{date}</span> : null}
            {budget ? <span>· {budget}</span> : null}
          </div>
          <div style={{ marginTop: 48, fontSize: 28, color: "#26221d", fontWeight: 700 }}>Giftr</div>
        </div>
      </div>
    ),
    size,
  );
}
