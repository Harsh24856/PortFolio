"use client"

import { useEffect, useRef } from "react"
import s from "./Reticle.module.css"

/* A CAD selection reticle. It trails the pointer as a small crosshair and,
   over anything marked [data-cursor], opens into four corner brackets fitted
   to that element's box, the way an editor shows what is selected. The
   native cursor stays: this only annotates it. */
export function Reticle() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return
    el.dataset.on = "1"

    const cur = { x: innerWidth / 2, y: innerHeight / 2, w: 18, h: 18 }
    const to = { ...cur }
    let target: HTMLElement | null = null
    let visible = false
    let raf = 0

    const fit = () => {
      if (target) {
        const r = target.getBoundingClientRect()
        to.w = r.width + 14
        to.h = r.height + 14
        to.x = r.left + r.width / 2
        to.y = r.top + r.height / 2
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      if (!visible) {
        visible = true
        el.dataset.visible = "1"
        cur.x = e.clientX
        cur.y = e.clientY
      }
      const t = (e.target as Element | null)?.closest?.("[data-cursor]") as HTMLElement | null
      target = t
      el.dataset.lock = t ? "1" : ""
      if (t) fit()
      else {
        to.x = e.clientX
        to.y = e.clientY
        to.w = 18
        to.h = 18
      }
    }
    const onLeave = () => {
      visible = false
      el.dataset.visible = ""
    }
    const tick = () => {
      if (target) fit()
      const k = 0.22
      cur.x += (to.x - cur.x) * k
      cur.y += (to.y - cur.y) * k
      cur.w += (to.w - cur.w) * k
      cur.h += (to.h - cur.h) * k
      el.style.transform = `translate3d(${(cur.x - cur.w / 2).toFixed(1)}px, ${(cur.y - cur.h / 2).toFixed(1)}px, 0)`
      el.style.width = `${cur.w.toFixed(1)}px`
      el.style.height = `${cur.h.toFixed(1)}px`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <div ref={root} className={s.reticle} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <b />
    </div>
  )
}
