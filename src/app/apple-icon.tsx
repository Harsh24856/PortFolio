import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/* The mark on black for home screens: the die, its pins, the routed H. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000" }}>
        <svg viewBox="0 0 40 40" width="180" height="180" fill="none">
          <rect x="7.5" y="7.5" width="25" height="25" rx="2" stroke="#f4f5f7" strokeWidth="1.6" />
          <path
            d="M12 2.5v5M20 2.5v5M28 2.5v5M12 32.5v5M20 32.5v5M28 32.5v5M2.5 12h5M2.5 20h5M2.5 28h5M32.5 12h5M32.5 20h5M32.5 28h5"
            stroke="#8b919b"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M15 13v14M25 13v14M15 20h10" stroke="#f4f5f7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="20" r="2.3" fill="#7aa7ff" />
        </svg>
      </div>
    ),
    size,
  )
}
