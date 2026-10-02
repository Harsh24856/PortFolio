"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { chapters, profile } from "@/content/profile"
import { useChapter } from "@/lib/chapter"
import { Mark } from "./Mark"
import { MotionToggle } from "./MotionToggle"
import s from "./Nav.module.css"

export function Nav({ home = true }: { home?: boolean }) {
  const { id } = useChapter()
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [hidden, setHidden] = useState(false)
  const last = useRef(0)
  const burger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setStuck(y > 40)
      setHidden(y > last.current + 4 && y > window.innerHeight * 0.8)
      last.current = y
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        burger.current?.focus()
      }
    }
    const onResize = () => window.innerWidth > 860 && setOpen(false)
    document.documentElement.classList.add("nav-open")
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    return () => {
      document.documentElement.classList.remove("nav-open")
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
    }
  }, [open])

  const href = (anchor: string) => (home ? `#${anchor}` : `/#${anchor}`)

  return (
    <header className={s.nav} data-stuck={stuck || undefined} data-hidden={(hidden && !open) || undefined} data-open={open || undefined}>
      <Link className={s.brand} href={home ? "#top" : "/"} data-cursor aria-label={`${profile.name}, back to top`}>
        <Mark size={30} />
        <span className={s.brandTx}>
          <b>{profile.name}</b>
          <i>{profile.role}</i>
        </span>
      </Link>

      <nav id="site-menu" className={s.links} aria-label="Sections">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            className={s.link}
            href={href(c.id)}
            data-cursor
            aria-current={home && id === c.id ? "true" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className={`${s.idx} num`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={s.lbl}>{c.label}</span>
          </a>
        ))}
        <MotionToggle placement="menu" />
      </nav>

      <button
        ref={burger}
        className={s.burger}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i />
        <i />
      </button>
    </header>
  )
}
