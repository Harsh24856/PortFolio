"use client"

import { useChapter } from "@/lib/chapter"
import s from "./ChapterRail.module.css"

const STOPS = [
  { id: "hero", label: "Top" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "datasheets", label: "Datasheets" },
  { id: "toolkit", label: "Toolkit" },
  { id: "contact", label: "Contact" },
]

/* The chapter rail: one tick per waypoint on the camera path. */
export function ChapterRail() {
  const { id } = useChapter()
  return (
    <nav className={s.rail} aria-label="Chapters">
      {STOPS.map((stop) => (
        <a
          key={stop.id}
          href={stop.id === "hero" ? "#top" : `#${stop.id}`}
          className={s.stop}
          aria-current={id === stop.id ? "true" : undefined}
          data-cursor
        >
          <span className={s.tip}>{stop.label}</span>
          <i aria-hidden="true" />
        </a>
      ))}
    </nav>
  )
}
