"use client"

import { useRef, useState, type ReactNode } from "react"
import { emit } from "@/lib/bus"
import { usePinProgress } from "@/lib/pin"
import s from "./About.module.css"

const GAP_MM = 1.8 * 19.05
const N = 5
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* The pinned stretch of the assembly chapter. Scrolling through it pulls
   the layers apart, walks the list from the tray up, then seats them again.
   The separation goes to the scene and to the gauge at the right. */
export function AssemblyPin({ children }: { children: ReactNode }) {
  const [mm, setMm] = useState(0)
  const last = useRef({ layer: -1 })
  const ref = usePinProgress<HTMLElement>((p) => {
    const e = smooth(0.02, 0.22, p) * (1 - smooth(0.86, 0.99, p))
    emit("scene:assembly", { e })
    setMm(Math.round(e * GAP_MM * 10) / 10)
    const layer = e < 0.02 ? -1 : Math.min(N - 1, Math.floor(smooth(0.16, 0.84, p) * N))
    if (layer !== last.current.layer) {
      last.current.layer = layer
      document.querySelectorAll<HTMLElement>("[data-layers] > li").forEach((li, i) => {
        if (i === layer) li.setAttribute("data-on", "")
        else li.removeAttribute("data-on")
      })
    }
  })
  const seated = mm < 0.05
  return (
    <section id="about" ref={ref} className={s.about} data-cam="1" data-cam-hold aria-labelledby="about-h">
      <div className={s.pin}>
        {children}
        <div className={s.gauge} aria-hidden="true">
          <div className={s.ruler}>
            <i style={{ transform: `scaleY(${Math.min(1, mm / GAP_MM)})` }} />
          </div>
          <p className={s.mm}>
            <span className="num">{mm.toFixed(1)}</span>
            <small>mm</small>
          </p>
          <p className="tag">{seated ? "Seated" : "Apart"}</p>
        </div>
      </div>
    </section>
  )
}
