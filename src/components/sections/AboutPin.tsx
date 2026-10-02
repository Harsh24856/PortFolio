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
   list of strengths one at a time, and the board behind comes apart and
   seats again as it goes. The gauge on the right counts the list. */
export function AboutPin({ children, count }: { children: ReactNode; count: number }) {
  const [at, setAt] = useState(-1)
  const last = useRef(-1)
  const ref = usePinProgress<HTMLElement>((p) => {
    const e = smooth(0.02, 0.22, p) * (1 - smooth(0.86, 0.99, p))
    emit("scene:assembly", { e })
    const item = e < 0.02 ? -1 : Math.min(count - 1, Math.floor(smooth(0.12, 0.88, p) * count))
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
