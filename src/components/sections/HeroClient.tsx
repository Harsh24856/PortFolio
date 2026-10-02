"use client"

import { useEffect, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { emit } from "@/lib/bus"
import s from "./Hero.module.css"

const CHIPS = [
  { href: "#about", label: "About", note: "Who I am and how I work with founders." },
  { href: "#work", label: "Work", note: "Four products, built end to end." },
  { href: "#datasheets", label: "Datasheets", note: "How each one is wired." },
  { href: "#contact", label: "Contact", note: "Send a note about what you are building." },
]

/* The four chapters on offer. Resting on one lights its block on the die. */
export function HeroChips() {
  const [on, setOn] = useState(-1)
  const set = (i: number) => {
    setOn(i)
    emit("die:focus", { index: i })
  }
  return (
    <nav className={s.chips} aria-label="Chapters" data-hero-chips>
      {CHIPS.map((c, i) => (
        <a
          key={c.href}
          className={s.chip}
          href={c.href}
          data-cursor
          data-reveal-fade
          data-on={on === i || undefined}
          style={{ transitionDelay: `${0.35 + i * 0.08}s` }}
          onPointerEnter={() => set(i)}
          onPointerLeave={() => set(-1)}
          onFocus={() => set(i)}
          onBlur={() => set(-1)}
        >
          <span className={`${s.chipNum} num`}>{String(i + 1).padStart(2, "0")}</span>
          <span className={s.chipTx}>
            <b>{c.label}</b>
            <span>{c.note}</span>
          </span>
        </a>
      ))}
    </nav>
  )
}

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
    let ctx: gsap.Context | null = null
    const build = () => {
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        const chips = gsap.utils.toArray<HTMLElement>("[data-hero-chips] > a")
        const readout = document.querySelector<HTMLElement>("[data-hero-readout]")
        const top = document.querySelector<HTMLElement>("[data-hero-top]")
        /* these carry the reveal's own CSS transition, which would trail
           every value written here by most of a second */
        ;[...chips, readout].forEach((el) => el && (el.style.transition = "none"))
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 35%", scrub: 0.6 },
        })
        const out = { autoAlpha: 0, y: 16, duration: 0.3, immediateRender: false }
        const rest = { autoAlpha: 1, y: 0 }
        if (readout) tl.fromTo(readout, rest, out, 0)
        chips.forEach((c, i) => tl.fromTo(c, rest, out, 0.1 + i * 0.08))
        if (top) tl.fromTo(top, rest, { ...out, y: -24, duration: 0.5 }, 0.35)
      })
    }
    window.addEventListener("scroll", build, { once: true, passive: true })
    return () => {
      window.removeEventListener("scroll", build)
      ctx?.revert()
    }
  }, [])
  return null
}
