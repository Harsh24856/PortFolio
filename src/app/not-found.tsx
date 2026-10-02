import Link from "next/link"

export default function NotFound() {
  return (
    <main className="lost">
      <p className="lost-code">404</p>
      <h1>This page isn&apos;t here.</h1>
      <p>The link may be old, or the address mistyped.</p>
      <Link href="/">Back to the portfolio</Link>
    </main>
  )
}
