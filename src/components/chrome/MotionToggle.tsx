"use client"

import { setPaused, useMotionPaused } from "@/lib/motionPref"
import s from "./MotionToggle.module.css"

/* WCAG 2.2.2: the scene's ambient motion (the board's float, the breathing
   underglow, the cut drifting with the pointer, the typed greeting, cloth
   wind, diagram packets) runs alongside the content indefinitely, so it can
   be paused. Two placements share one setting: at the foot of the chapter
   rail on wide screens, and inside the menu sheet everywhere. */
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
