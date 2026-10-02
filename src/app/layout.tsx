import type { Metadata, Viewport } from "next"
import { Archivo, B612_Mono } from "next/font/google"
import { bootScript } from "@/lib/boot"
import { profile, siteUrl } from "@/content/profile"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
})

const b612 = B612_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-b612",
  display: "swap",
})

const description =
  "Harsh Sehra builds web, mobile and machine learning products end to end for early-stage startups: interface, API, data and the models on top. Based in Chandigarh, India."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${profile.name} | ${profile.role}`, template: `%s | ${profile.name}` },
  description,
  openGraph: {
    type: "website",
    title: `${profile.name} | ${profile.role}`,
    description,
    siteName: profile.name,
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${b612.variable}`} suppressHydrationWarning>
      <head>
        {/* runs before first paint; the root layout never re-mounts, so this
            is only ever rendered by the server */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
