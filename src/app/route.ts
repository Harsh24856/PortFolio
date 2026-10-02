import { readFile } from "node:fs/promises"
import path from "node:path"

/* The home page is a self-contained document (WebGL scene, sketchbook window,
   contact form). It is served as-is, with the EmailJS ids baked in so the form
   can post straight from the browser. Without them the form falls back to the
   visitor's mail app. */
const FILE = path.join(process.cwd(), "src", "site", "index.html")

export async function GET() {
  const { NEXT_PUBLIC_EMAILJS_SERVICE_ID: service, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: template, NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: key } =
    process.env
  const cfg = service && template && key ? JSON.stringify({ service, template, key }).replace(/</g, "\\u003c") : "null"
  const html = (await readFile(FILE, "utf8")).replace("__EMAILJS__", cfg)
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" },
  })
}
