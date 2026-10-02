import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "Harsh Sehra | Software Engineer" }
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#05070a", colorScheme: "dark" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
