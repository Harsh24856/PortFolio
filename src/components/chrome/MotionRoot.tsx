"use client"

import { useEffect } from "react"

/* Headings carry [data-reveal]; each is revealed once, the first time it
   reaches the lower part of the frame. The hero is not observed here: the
   intro sequence reveals it. */
export function MotionRoot() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (el) => !el.closest("#hero"),
    )
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: "0px 0px -12% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
