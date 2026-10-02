"use client"

import { useEffect, useRef } from "react"
import { emit } from "@/lib/bus"
import { pickTier } from "@/lib/tier"
import s from "./SceneCanvas.module.css"

/* Mounts the keyboard scene behind the page. The engine is a separate chunk that
   only downloads after the page has painted; if WebGL is missing, the device
   is too weak, or any required build step throws, the poster stays and the
   page carries on exactly as it would with the scene. */
export function SceneCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false
    let dispose: (() => void) | undefined
    const fail = (reason: string) => {
      document.documentElement.classList.add("no-webgl")
      emit("scene:fail", { reason })
    }

    const tier = pickTier()
    if (tier === "low") {
      fail("low tier")
      return
    }
    import("@/engine")
      .then(({ startEngine }) => (cancelled ? undefined : startEngine(el, { tier })))
      .then((d) => {
        if (cancelled) d?.()
        else dispose = d
      })
      .catch((err: unknown) => {
        console.error("[scene] engine failed", err)
        if (!cancelled) fail(String(err))
      })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [])

  return (
    <>
      <div className={s.poster} aria-hidden="true" />
      <canvas ref={canvas} className={s.canvas} aria-hidden="true" />
      <div className={s.vignette} aria-hidden="true" />
    </>
  )
}
