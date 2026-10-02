"use client"

import { useEffect, useRef, useState } from "react"
import { emit, on } from "@/lib/bus"
import { introPlayed, runIntro } from "@/lib/intro"
import s from "./Preloader.module.css"

/* The build log. The engine reports each build step as it runs; the
   bar becomes the scan line that exposes the wordmark once it hands over.
   It never holds the page hostage: if the scene is slow or absent, it steps
   aside after a few seconds and the scene fades in behind the copy later. */
const CAP_MS = 4200
const CAP_MS_SMALL = 2600

export function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const done = useRef(false)

  useEffect(() => {
    const finish = () => {
      if (done.current) return
      done.current = true
      setP(1)
      void runIntro(root.current, () => emit("scene:intro", {}))
    }
    const offP = on("scene:progress", ({ p, step }) => {
      setP((v) => Math.max(v, p))
      setLog((l) => (l[l.length - 1] === step ? l : [...l.slice(-4), step]))
    })
    const offR = on("scene:ready", () => setTimeout(finish, 240))
    const offF = on("scene:fail", finish)
    /* phones get the shorter wait: the copy matters more than the reveal */
    const cap = setTimeout(finish, window.innerWidth < 860 ? CAP_MS_SMALL : CAP_MS)
    /* nothing to wait for: the intro already played this visit, or the
       scene has already reported it is not coming (that event can fire
       before this effect subscribes) */
    if (introPlayed() || document.documentElement.classList.contains("no-webgl")) finish()
    return () => {
      offP()
      offR()
      offF()
      clearTimeout(cap)
    }
  }, [])

  const pct = Math.round(p * 100)

  return (
    <div id="pre" ref={root} className={s.pre} role="status" aria-live="polite" aria-label="Loading the scene">
      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.name}>Harsh Sehra</span>
          <span className={`${s.pct} num`} aria-hidden="true">
            {String(pct).padStart(3, "0")}
            <small>%</small>
          </span>
        </div>
        <div className={s.bar} data-bar>
          <i style={{ transform: `scaleX(${p})` }} />
        </div>
        <ol className={`${s.log} mono`} aria-hidden="true">
          {log.map((step, i) => (
            <li key={step} data-current={i === log.length - 1 ? "" : undefined}>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <div className={s.scan} data-scan aria-hidden="true" />
    </div>
  )
}
