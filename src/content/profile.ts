export const profile = {
  name: "Harsh Sehra",
  role: "Full-stack and applied AI engineer",
  location: "Chandigarh, India",
  email: "harshsehra1@gmail.com",
  github: { handle: "Harsh24856", href: "https://github.com/Harsh24856" },
  linkedin: { handle: "Harsh Sehra", href: "https://www.linkedin.com/in/harsh-sehra-223a81346/" },
} as const

/** Absolute origin for metadata and the sitemap. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000"

/** The chapters the camera walks, in scroll order, after the hero (00). */
export const chapters = [
  { id: "about", label: "Assembly", note: "How I build, layer by layer." },
  { id: "toolkit", label: "Layout", note: "Every tool I reach for." },
  { id: "work", label: "Work", note: "Four products, built end to end." },
  { id: "datasheets", label: "Datasheets", note: "How each one is wired." },
  { id: "contact", label: "Contact", note: "Send a note about what you are building." },
] as const

/** The board's five layers, bottom up, and the part of a product each one is. */
export const layers = [
  {
    part: "Tray",
    role: "Infrastructure",
    note: "Docker, CI and the cloud underneath. Nothing above it holds if this flexes.",
  },
  {
    part: "Diffuser",
    role: "Data",
    note: "Postgres and Supabase: the layer everything else is lit by.",
  },
  {
    part: "Switches",
    role: "Services",
    note: "Node, Express and FastAPI, where every press becomes a request.",
  },
  {
    part: "Top case",
    role: "Interface",
    note: "React and React Native, framing what a person can reach.",
  },
  {
    part: "Keycaps",
    role: "Product",
    note: "The part people touch. It has to feel right the first time.",
  },
] as const

export const specs = [
  { k: "CGPA at PEC", v: "8.91", unit: "/ 10" },
  { k: "Freelancing since", v: "2024", unit: "" },
  { k: "Products shipped", v: "4", unit: "" },
  { k: "B.Tech graduation", v: "2028", unit: "" },
] as const
