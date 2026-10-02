"use client"

import { useSyncExternalStore } from "react"

/* Which chapter the reader is standing in: the [data-cam] section whose band
   holds the middle of the viewport. One scroll listener for the whole page,
   shared by the nav, the rail and the foreground layers. */

type State = { index: number; id: string }

let state: State = { index: 0, id: "hero" }
const listeners = new Set<() => void>()
let wired = false

function measure() {
  const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"))
  if (!secs.length) return
  const mid = window.innerHeight * 0.5
  let best = 0
  for (let i = 0; i < secs.length; i++) {
    const r = secs[i].getBoundingClientRect()
    if (r.top <= mid) best = i
  }
  const id = secs[best].id || secs[best].dataset.chapter || String(best)
  if (best !== state.index || id !== state.id) {
    state = { index: best, id }
    listeners.forEach((l) => l())
  }
}

function wire() {
  if (wired || typeof window === "undefined") return
  wired = true
  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      measure()
    })
  }
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule, { passive: true })
  schedule()
}

function subscribe(fn: () => void) {
  wire()
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const server: State = { index: 0, id: "hero" }

export function useChapter() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => server,
  )
}
