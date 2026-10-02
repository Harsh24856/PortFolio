"use client"

import { useEffect, useState } from "react"

/* Local time in Chandigarh, so a reader in another zone knows when a reply
   is likely. Rendered empty on the server to avoid a hydration mismatch. */
export function LocalTime() {
  const [t, setT] = useState("")
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
      hour12: false,
    })
    const tick = () => setT(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>{t ? `${t} IST` : ""}</span>
}

/* Leaving the hero: everything along its foot is spent the moment the walk
   starts, so it stands down piece by piece as the scroll leaves, scrubbed to
   the scroll rather than timed. Built on the first scroll, never before: by
   then the intro has revealed the hero, and the start values are explicit
   so a half-finished reveal can never be recorded as the resting state. */
export function HeroExit() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let ctx: { revert(): void } | null = null
    let dead = false
    const build = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      if (dead) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        const parts = gsap.utils.toArray<HTMLElement>("[data-hero-fade]")
        const top = document.querySelector<HTMLElement>("[data-hero-top]")
        /* these carry the reveal's own CSS transition, which would trail
           every value written here by most of a second */
        parts.forEach((el) => (el.style.transition = "none"))
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 35%", scrub: 0.6 },
        })
        const out = { autoAlpha: 0, y: 16, duration: 0.3, immediateRender: false }
        const rest = { autoAlpha: 1, y: 0 }
        parts.forEach((c, i) => tl.fromTo(c, rest, out, i * 0.08))
        if (top) tl.fromTo(top, rest, { ...out, y: -24, duration: 0.5 }, 0.35)
      })
    }
    const onScroll = () => void build()
    window.addEventListener("scroll", onScroll, { once: true, passive: true })
    return () => {
      dead = true
      window.removeEventListener("scroll", onScroll)
      ctx?.revert()
    }
  }, [])
  return null
}
