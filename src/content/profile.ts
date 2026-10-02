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

/** The chapters the camera walks, in scroll order. `cam` is the waypoint index. */
export const chapters = [
  { id: "about", label: "About", note: "Who I am and how I work with founders." },
  { id: "work", label: "Work", note: "Four products, built end to end." },
  { id: "datasheets", label: "Datasheets", note: "How each one is wired." },
  { id: "toolkit", label: "Toolkit", note: "What each project runs on." },
  { id: "contact", label: "Contact", note: "Send a note about what you are building." },
] as const

export const specs = [
  { k: "CGPA at PEC", v: "8.91", unit: "/ 10" },
  { k: "Freelancing since", v: "2024", unit: "" },
  { k: "Products shipped", v: "4", unit: "" },
  { k: "B.Tech graduation", v: "2028", unit: "" },
] as const
