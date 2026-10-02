"use client"

import { useChapter } from "@/lib/chapter"
import s from "./ChapterRail.module.css"

const STOPS = [
  { id: "hero", label: "Index" },
  { id: "about", label: "Assembly" },
  { id: "toolkit", label: "Layout" },
  { id: "work", label: "Work" },
  { id: "datasheets", label: "Datasheets" },
  { id: "contact", label: "Contact" },
]

/* The chapter rail down the left edge: a column of chapter numbers on a
   hairline, the current one lit, each a jump to its chapter. */
export function ChapterRail() {
  const { id } = useChapter()
  return (
    <nav className={s.rail} aria-label="Jump to chapter">
      <ol>
        {STOPS.map((stop, i) => (
          <li key={stop.id}>
            <a
              href={stop.id === "hero" ? "#top" : `#${stop.id}`}
              className={s.stop}
              aria-current={id === stop.id ? "true" : undefined}
              data-cursor
            >
              <span className="num" aria-hidden="true">
                {String(i).padStart(2, "0")}
              </span>
              <span className={s.tip}>{stop.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
