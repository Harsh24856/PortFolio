"use client"

import { useEffect, useRef } from "react"

/* Progress through a pinned section: 0 when its top reaches the top of the
   viewport, 1 when its bottom reaches the bottom. Reported once a frame at
   most, and only when it changes. */
export function usePinProgress<T extends HTMLElement>(fn: (p: number) => void) {
  const ref = useRef<T>(null)
  const cb = useRef(fn)
  useEffect(() => {
    cb.current = fn
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let queued = false
    let last = -1
    const measure = () => {
      queued = false
      const r = el.getBoundingClientRect()
      const span = Math.max(1, r.height - window.innerHeight)
      const p = Math.min(1, Math.max(0, -r.top / span))
      if (Math.abs(p - last) < 0.0005) return
      last = p
      cb.current(p)
    }
    const schedule = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])
  return ref
}
