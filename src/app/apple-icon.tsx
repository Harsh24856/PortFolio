import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/* The mark on black for home screens: a keycap from above, H for a legend. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000" }}>
        <svg viewBox="0 0 40 40" width="180" height="180" fill="none">
          <rect x="3.5" y="3.5" width="33" height="33" rx="7" stroke="#8b919b" strokeWidth="1.6" />
          <rect x="9" y="7.5" width="22" height="21" rx="5" stroke="#f4f5f7" strokeWidth="1.6" />
          <path d="M15.5 12.5v11M24.5 12.5v11M15.5 18h9" stroke="#f4f5f7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="29.5" cy="32" r="1.9" fill="#7aa7ff" />
        </svg>
      </div>
    ),
    size,
  )
}
