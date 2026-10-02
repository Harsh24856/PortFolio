"use client"

import { setPaused, useMotionPaused } from "@/lib/motionPref"
import s from "./MotionToggle.module.css"

/* WCAG 2.2.2: the scene's ambient motion (packets, the array, dust, cloth
   wind) runs alongside the content indefinitely, so it can be paused. Two
   placements share one setting: under the chapter rail on wide screens, and
   inside the menu sheet on narrow ones, where nothing should float over the
   content. */
export function MotionToggle({ placement = "rail" }: { placement?: "rail" | "menu" }) {
  const paused = useMotionPaused()
  const label = paused ? "Play background motion" : "Pause background motion"
  if (placement === "menu") {
    return (
      <button type="button" className={s.menu} aria-pressed={paused} onClick={() => setPaused(!paused)}>
        <span className={s.icon} aria-hidden="true" data-paused={paused || undefined} />
        Pause background motion
      </button>
    )
  }
  return (
    <button
      type="button"
      className={s.toggle}
      aria-label="Pause background motion"
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
      data-cursor
    >
      <span className={s.icon} aria-hidden="true" data-paused={paused || undefined} />
      <span className={s.tip} aria-hidden="true">
        {label}
      </span>
    </button>
  )
}
