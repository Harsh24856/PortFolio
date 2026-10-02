import type { MetadataRoute } from "next"
import { projects } from "@/content/projects"
import { siteUrl } from "@/content/profile"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({ url: `${siteUrl}/work/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.7 })),
  ]
}
