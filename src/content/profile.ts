export const profile = {
  name: "Harsh Sehra",
  role: "Full-stack and generative AI engineer",
  location: "Chandigarh, India",
  email: "harshsehra1@gmail.com",
  github: { handle: "Harsh24856", href: "https://github.com/Harsh24856" },
  linkedin: { handle: "Harsh Sehra", href: "https://www.linkedin.com/in/harsh-sehra-223a81346/" },
} as const

/** Absolute origin for metadata and the sitemap. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000"

/** The chapters the camera walks, in scroll order, after the hero (00). */
export const chapters = [
  { id: "about", label: "About", note: "Who I am and what I am good at." },
  { id: "toolkit", label: "Toolkit", note: "Every tool I reach for." },
  { id: "work", label: "Work", note: "Four products, built end to end." },
  { id: "datasheets", label: "Datasheets", note: "How each one is wired." },
  { id: "contact", label: "Contact", note: "Send a note about what you are building." },
] as const

/** What I bring, in five parts. The About chapter walks them one at a time. */
export const strengths = [
  {
    title: "Full-stack web",
    tag: "React, Next.js, Node",
    note: "Interfaces, APIs and databases built as one system, so nothing gets lost between the layers.",
  },
  {
    title: "Mobile apps",
    tag: "React Native, Expo",
    note: "Cross-platform apps from a single codebase, with live maps and real-time updates where they matter.",
  },
  {
    title: "Generative AI and ML",
    tag: "LLMs, Python, TensorFlow",
    note: "LLM features and models that earn their place in a product, from engine fault detection to document OCR.",
  },
  {
    title: "Backends and data",
    tag: "FastAPI, Postgres, Supabase",
    note: "Typed APIs, clean schemas and real-time sync that hold up once real users arrive.",
  },
  {
    title: "Working with founders",
    tag: "Freelance since 2024",
    note: "Turning a rough idea into a scoped, shipped product, then staying on to iterate on it.",
  },
] as const

export const specs = [
  { k: "CGPA at PEC", v: "8.91", unit: "/ 10" },
  { k: "Freelancing since", v: "2024", unit: "" },
  { k: "Products shipped", v: "4", unit: "" },
  { k: "B.Tech graduation", v: "2028", unit: "" },
] as const
