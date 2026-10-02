import type { CSSProperties } from "react"

/* A section heading set as masked lines, so it can rise into place line by
   line. The lines are authored, not computed: where a heading breaks is a
   typographic decision. */
export function Heading({
  id,
  lines,
  level = 2,
  className = "",
}: {
  id?: string
  lines: string[]
  level?: 1 | 2
  className?: string
}) {
  const Tag = level === 1 ? "h1" : "h2"
  return (
    <Tag id={id} className={`display ${level === 1 ? "h1" : "h2"} on-scene ${className}`}>
      {lines.map((line, i) => (
        <span className="mask-line" key={i}>
          <span style={{ "--i": i } as CSSProperties}>{line}</span>
        </span>
      ))}
    </Tag>
  )
}
