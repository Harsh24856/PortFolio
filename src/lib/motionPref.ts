"use client"

import { useSyncExternalStore } from "react"
import { emit } from "./bus"

/* The reader's choice to pause the scene's ambient motion, shared by every
   toggle on the page and remembered on this device. Reduced-motion users
   start paused. */

const KEY = "die:paused"
const listeners = new Set<() => void>()
let paused: boolean | null = null

function read(): boolean {
  if (paused !== null) return paused
  let v = matchMedia("(prefers-reduced-motion: reduce)").matches
  try {
    const s = localStorage.getItem(KEY)
    if (s !== null) v = s === "1"
  } catch {
    /* storage unavailable: the media query decides */
  }
  paused = v
  apply(v)
  return v
}

function apply(v: boolean) {
  document.documentElement.classList.toggle("motion-paused", v)
  emit("die:pause", { paused: v })
  document.querySelectorAll<SVGSVGElement>("svg").forEach((svg) => {
    if (typeof svg.pauseAnimations !== "function") return
    if (v) svg.pauseAnimations()
    else svg.unpauseAnimations()
  })
}

export function setPaused(v: boolean) {
  paused = v
  try {
    localStorage.setItem(KEY, v ? "1" : "0")
  } catch {
    /* not persisted */
  }
  apply(v)
  listeners.forEach((l) => l())
}

export function useMotionPaused() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    read,
    () => false,
  )
}
