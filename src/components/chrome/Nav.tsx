"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { chapters, profile } from "@/content/profile"
import { useChapter } from "@/lib/chapter"
import { Mark } from "./Mark"
import { MotionToggle } from "./MotionToggle"
import s from "./Nav.module.css"

/* The top bar, as on a product page: the name on the left, a menu and the
   one call to action on the right. The menu opens a full sheet of numbered
   chapters. */
export function Nav({ home = true }: { home?: boolean }) {
  const { id } = useChapter()
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const burger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40)
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
    document.documentElement.classList.add("nav-open")
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.classList.remove("nav-open")
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const href = (anchor: string) => (home ? `#${anchor}` : `/#${anchor}`)

  return (
    <header className={s.nav} data-stuck={stuck || undefined} data-open={open || undefined}>
      <Link className={s.brand} href={home ? "#top" : "/"} data-cursor aria-label={`${profile.name}, back to top`}>
        <Mark size={28} />
        <b>{profile.name}</b>
        <span className="tag">SWE / AI</span>
      </Link>

      <div className={s.right}>
        <button
          ref={burger}
          className={s.menuBtn}
          type="button"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
          data-cursor
        >
          <span className={s.menuTx}>{open ? "Close" : "Menu"}</span>
          <span className={s.bars} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
        <a className={`btn btn--solid ${s.cta}`} href={href("contact")} data-cursor>
          Get in touch
        </a>
      </div>

      <nav id="site-menu" className={s.sheet} aria-label="Sections" hidden={!open}>
        <ol className={s.list}>
          <li>
            <a href={home ? "#top" : "/"} onClick={() => setOpen(false)} data-cursor>
              <span className={`${s.idx} num`}>00</span>
              <span className={s.lbl}>Index</span>
            </a>
          </li>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a
                href={href(c.id)}
                aria-current={home && id === c.id ? "true" : undefined}
                onClick={() => setOpen(false)}
                data-cursor
              >
                <span className={`${s.idx} num`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.lbl}>{c.label}</span>
                <span className={s.note}>{c.note}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className={s.sheetFoot}>
          <a href={`mailto:${profile.email}`} data-cursor>
            {profile.email}
          </a>
          <MotionToggle placement="menu" />
        </div>
      </nav>
    </header>
  )
}
