"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, ViewTransition } from "react"
import type { Project } from "@/content/projects"
import s from "./Work.module.css"

/* A project card whose screenshot hangs as cloth. The flat image stays in
   the DOM underneath as the fallback, and is only hidden once the fabric is
   actually carrying it. */
export function ClothCard({ project, index }: { project: Project; index: number }) {
  const frame = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const fr = frame.current
    const el = card.current
    if (!fr || !el) return
    const coarse = window.matchMedia("(hover: none)").matches
    const tooSmall = Math.min(screen.width, screen.height) < 360
    if (tooSmall) return

    let cancelled = false
    let dispose: (() => void) | null = null
    const img = new window.Image()
    img.decoding = "async"
    img.onload = async () => {
      if (cancelled) return
      const { createCloth, clothPlate } = await import("@/engine/cloth")
      if (cancelled) return
      const dpr = Math.min(devicePixelRatio || 1, 2)
      let plate: HTMLCanvasElement | null = null
      let pw = 0
      let ph = 0
      const get = () => {
        const w = Math.round(fr.clientWidth * dpr)
        const h = Math.round(fr.clientHeight * dpr)
        if (!plate || w !== pw || h !== ph) {
          plate = clothPlate(img, w, h)
          pw = w
          ph = h
        }
        return plate
      }
      const out = document.createElement("canvas")
      out.className = s.clothOut
      out.setAttribute("aria-hidden", "true")
      fr.appendChild(out)
      const inst = createCloth(out, get, coarse ? { brushSize: 110, wind: 2.2 } : {})
      if (!inst) {
        out.remove()
        return
      }
      fr.dataset.cloth = "on"
      const hot = () => inst.setHot(true)
      const cold = () => inst.setHot(false)
      const focus = () => inst.setFocus(true)
      const blur = () => inst.setFocus(false)
      el.addEventListener("pointerenter", hot)
      el.addEventListener("pointerleave", cold)
      el.addEventListener("focus", focus)
      el.addEventListener("blur", blur)
      dispose = () => {
        el.removeEventListener("pointerenter", hot)
        el.removeEventListener("pointerleave", cold)
        el.removeEventListener("focus", focus)
        el.removeEventListener("blur", blur)
        inst.dispose()
        out.remove()
        delete fr.dataset.cloth
      }
    }
    img.src = project.image
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [project.image])

  return (
    <Link
      ref={card}
      href={`/work/${project.slug}`}
      className={s.card}
      data-card={index}
      data-cursor
      data-reveal
      aria-label={`${project.name}, ${project.year}. Read the case study.`}
    >
      <ViewTransition name={`plate-${project.slug}`}>
      <div ref={frame} className={s.frame} data-reveal-fade>
        <Image
          className={s.img}
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 860px) 92vw, 50vw"
          priority={index === 0}
        />
        <div className={s.label}>
          <b>{project.name}</b>
          <span className="num">{project.year}</span>
        </div>
      </div>
      </ViewTransition>
      <div className={s.meta} data-reveal-fade>
        <p className={s.kind}>{project.kind}</p>
        <p className={s.summary}>{project.summary}</p>
        <p className={`${s.stack} mono`}>{project.stack.join(", ")}</p>
      </div>
    </Link>
  )
}
