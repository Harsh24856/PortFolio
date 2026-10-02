import { ImageResponse } from "next/og"
import { profile } from "@/content/profile"

export const alt = `${profile.name}, ${profile.role}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/* The share card: the name typed out on five keycaps over a pool of blue
   underglow, then the name and role. Generated at build time. */
export default function OpenGraphImage() {
  const caps = "HARSH".split("")
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
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 380,
            background: "radial-gradient(ellipse 60% 70% at 70% 60%, rgba(47,91,255,0.35), rgba(0,0,0,0) 70%)",
          }}
        />
        <div style={{ position: "absolute", right: 80, top: 90, display: "flex", gap: 18 }}>
          {caps.map((c, i) => (
            <div
              key={i}
              style={{
                width: 118,
                height: 118,
                borderRadius: 18,
                background: "#dcd9d2",
                border: "10px solid #c4c0b8",
                borderTopWidth: 6,
                borderBottomWidth: 16,
                display: "flex",
                padding: "10px 14px",
                fontSize: 34,
                color: "#2b2c30",
                boxShadow: "0 18px 40px rgba(0,0,0,0.8)",
              }}
            >
              {c}
            </div>
          ))}
        </div>
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
