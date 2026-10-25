import { ImageResponse } from "next/og";
import { OgGift, ogColors } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ogColors.berry,
        }}
      >
        <OgGift size={132} box={ogColors.cream} ribbon={ogColors.gold} />
      </div>
    ),
    size,
  );
}
