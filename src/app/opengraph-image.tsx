import { ImageResponse } from "next/og"
import { profile } from "@/content/profile"

export const alt = `${profile.name}, ${profile.role}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/* The share card: the die's grid on black, the name, the role, and one blue
   via. Generated at build time. */
export default function OpenGraphImage() {
  const lines = Array.from({ length: 24 }, (_, i) => i)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          background: "#000",
          color: "#f4f5f7",
          position: "relative",
        }}
      >
        {lines.map((i) => (
          <div
            key={`v${i}`}
            style={{ position: "absolute", top: 0, bottom: 0, left: i * 52, width: 1, background: "rgba(122,167,255,0.10)" }}
          />
        ))}
        {lines.slice(0, 13).map((i) => (
          <div
            key={`h${i}`}
            style={{ position: "absolute", left: 0, right: 0, top: i * 52, height: 1, background: "rgba(122,167,255,0.10)" }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 560,
            height: 560,
            borderRadius: 9999,
            border: "2px solid rgba(160,190,255,0.7)",
            background: "radial-gradient(circle at 40% 40%, #1a2240, #05070c 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#a9afb8" }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: "#7aa7ff" }} />
          {profile.role}
        </div>
        <div style={{ fontSize: 120, letterSpacing: -4, lineHeight: 1, marginTop: 18 }}>{profile.name}</div>
        <div style={{ fontSize: 28, color: "#a9afb8", marginTop: 26 }}>
          Web, mobile and machine learning products, shipped end to end.
        </div>
      </div>
    ),
    size,
  )
}
