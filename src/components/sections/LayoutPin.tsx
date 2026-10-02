"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { emit } from "@/lib/bus"
import { usePinProgress } from "@/lib/pin"
import { toolGroups } from "@/content/toolkit"
import s from "./Toolkit.module.css"

const N = toolGroups.length
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* The pinned stretch of the toolkit chapter: one step of scroll per group.
   The tabs and the scroll are one control: choosing a tab scrolls to its
   step, and scrolling to a step selects its tab. */
export function LayoutPin({ head }: { head: ReactNode }) {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const ref = usePinProgress<HTMLElement>((p) => setActive(Math.min(N - 1, Math.floor(p * N * 0.999))))

  useEffect(() => {
    emit("scene:group", { index: active })
  }, [active])

  const choose = (i: number, focus = false) => {
    setActive(i)
    if (focus) tabs.current[i]?.focus()
    const el = ref.current
    if (!el) return
    /* land in the middle of the group's step */
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + span * ((i + 0.5) / N), behavior: reduced() ? "auto" : "smooth" })
  }
  const onKey = (e: KeyboardEvent) => {
    const k = e.key
    if (k === "ArrowRight" || k === "ArrowDown") choose((active + 1) % N, true)
    else if (k === "ArrowLeft" || k === "ArrowUp") choose((active + N - 1) % N, true)
    else if (k === "Home") choose(0, true)
    else if (k === "End") choose(N - 1, true)
    else return
    e.preventDefault()
  }
  const g = toolGroups[active]

  return (
    <section id="toolkit" ref={ref} className={s.layout} data-cam="2" data-cam-hold aria-labelledby="tools-h">
      <div className={s.pin}>
        {head}
        <div className={s.control}>
          <div className={s.tabs} role="tablist" aria-label="Tool groups" onKeyDown={onKey}>
            {toolGroups.map((grp, i) => (
              <button
                key={grp.name}
                ref={(b) => {
                  tabs.current[i] = b
                }}
                id={`tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="tool-panel"
                tabIndex={i === active ? 0 : -1}
                className={s.tab}
                onClick={() => choose(i)}
                data-cursor
              >
                <span className={`${s.tabN} num`}>{String(i + 1).padStart(2, "0")}</span>
                <b>{grp.name}</b>
              </button>
            ))}
          </div>
          <div id="tool-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className={s.panel}>
            <ul>
              {g.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className={s.readout} aria-hidden="true">
          <p className={s.count}>
            <span className="num">{String(g.tools.length).padStart(2, "0")}</span>
          </p>
          <p className="tag">Tools lit</p>
        </div>
      </div>
    </section>
  )
}
