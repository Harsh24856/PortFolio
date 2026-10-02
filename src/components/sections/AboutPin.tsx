"use client"

import { useRef, useState, type ReactNode } from "react"
import { emit } from "@/lib/bus"
import { usePinProgress } from "@/lib/pin"
import s from "./About.module.css"

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* The pinned stretch of the About chapter. Scrolling through it walks the
   list of strengths one at a time, and the board behind opens a little
   further with each one, then seats again at the end. The gauge on the right counts the list. */
export function AboutPin({ children, count }: { children: ReactNode; count: number }) {
  const [at, setAt] = useState(-1)
  const last = useRef(-1)
  const ref = usePinProgress<HTMLElement>((p) => {
    /* each strength opens the board a little further: the walk through the
       list runs from the top of the pin to 86%, then the board seats again */
    const walk = Math.min(1, Math.max(0, (p - 0.02) / 0.84))
    const item = p < 0.02 ? -1 : Math.min(count - 1, Math.floor(walk * count))
    const e = walk * (1 - smooth(0.9, 0.995, p))
    emit("scene:assembly", { e })
    if (item !== last.current) {
      last.current = item
      setAt(item)
      document.querySelectorAll<HTMLElement>("[data-layers] > li").forEach((li, i) => {
        if (i === item) li.setAttribute("data-on", "")
        else li.removeAttribute("data-on")
      })
    }
  })
  const shown = Math.max(0, at) + 1
  return (
    <section id="about" ref={ref} className={s.about} data-cam="1" data-cam-hold aria-labelledby="about-h">
      <div className={s.pin}>
        {children}
        <div className={s.gauge} aria-hidden="true">
          <div className={s.ruler}>
            <i style={{ transform: `scaleY(${at < 0 ? 0 : shown / count})` }} />
          </div>
          <p className={s.mm}>
            <span className="num">{String(shown).padStart(2, "0")}</span>
            <small>/ {String(count).padStart(2, "0")}</small>
          </p>
          <p className="tag">Strengths</p>
        </div>
      </div>
    </section>
  )
}
