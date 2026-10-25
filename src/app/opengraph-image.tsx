import { ImageResponse } from "next/og";
import { OgGift, OgSnow, ogColors, ogSize } from "@/lib/og";

export const alt = "Giftr: Secret Santa, simplified";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: ogColors.berry,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <OgSnow />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: ogColors.cream,
            }}
          >
            <OgGift size={52} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: ogColors.cream, letterSpacing: -1 }}>Giftr</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, color: ogColors.cream, lineHeight: 1.02, letterSpacing: -3 }}>
            Secret Santa, simplified.
          </div>
          <div style={{ fontSize: 32, color: "rgba(255,250,245,0.78)" }}>
            One link to join. Names drawn in a tap. Free, with no ads.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
