"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { projects, type Project } from "@/content/projects"
import { profile } from "@/content/profile"
import { ArchitectureDiagram } from "@/components/ui/ArchitectureDiagram"
import { Mark } from "@/components/chrome/Mark"
import s from "./Datasheets.module.css"

const partNo = (p: Project, i: number) => `HS-${p.year.slice(2)}${String(i + 1).padStart(2, "0")}`
const TOTAL = 2 + projects.length * 2
/** how long the pointer rests on the right-hand page before it turns */
const DWELL_MS = 5000
const AUTO_KEY = "book:auto-turn"
type Side = "left" | "right"

/* ------------------------------------------------------------ the pages */

function PageFrame({
  n,
  part,
  title,
  dark,
  children,
}: {
  n: number
  part?: string
  title?: string
  dark?: boolean
  children: ReactNode
}) {
  return (
    <div className={dark ? `${s.page} ${s.pageDark}` : s.page}>
      <div className={`${s.pageHead} mono`}>
        <span>{part ?? "HS-DS"}</span>
        <span>{title ?? "Datasheets"}</span>
      </div>
      <div className={s.pageBody}>{children}</div>
      <div className={`${s.pageFoot} mono`}>
        <span>{profile.name}</span>
        <span>
          {n} / {TOTAL}
        </span>
      </div>
    </div>
  )
}

function Cover() {
  return (
    <PageFrame n={1} dark>
      <div className={s.cover}>
        <Mark size={44} className={s.coverMark} />
        <p className={s.coverTitle}>Datasheets</p>
        <p className={s.coverSub}>Four products, documented like parts.</p>
        <dl className={`${s.coverMeta} mono`}>
          <div>
            <dt>Revision</dt>
            <dd>2026</dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd>{profile.name}</dd>
          </div>
        </dl>
      </div>
    </PageFrame>
  )
}

function Contents({ go }: { go: (spread: number) => void }) {
  return (
    <PageFrame n={2} title="Contents">
      <p className={s.sheetH}>Contents</p>
      <ol className={s.toc}>
        {projects.map((p, i) => (
          <li key={p.slug}>
            <button type="button" onClick={() => go(i + 1)} data-cursor>
              <span className="mono">{partNo(p, i)}</span>
              <b>{p.name}</b>
              <span className={s.tocDots} aria-hidden="true" />
              <span className="num">{3 + i * 2}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className={s.tocNote}>
        Every sheet pairs a screen with its architecture. The loupe shows one under the other.
      </p>
    </PageFrame>
  )
}

function XRay({ project, idPrefix }: { project: Project; idPrefix: string }) {
  const fig = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)
  const move = (e: React.PointerEvent) => {
    const el = fig.current
    if (!el || full) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--x", `${e.clientX - r.left}px`)
    el.style.setProperty("--y", `${e.clientY - r.top}px`)
    el.dataset.lens = "on"
  }
  const leave = () => {
    if (fig.current) delete fig.current.dataset.lens
  }
  return (
    <>
      <div ref={fig} className={s.xray} data-full={full || undefined} onPointerMove={move} onPointerLeave={leave}>
        <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 900px) 80vw, 40vw" className={s.xrayImg} />
        <div className={s.under} aria-hidden={!full}>
          <ArchitectureDiagram project={project} idPrefix={idPrefix} animate={full} />
        </div>
        <span className={s.lens} aria-hidden="true" />
      </div>
      <div className={s.xrayBar}>
        <p className={s.fig}>
          <span className="mono">Fig. 1</span> {full ? "System architecture" : "Interface, with the loupe over its wiring"}
        </p>
        <button type="button" className={s.toggle} aria-pressed={full} onClick={() => setFull((v) => !v)} data-cursor>
          {full ? "Show the screen" : "Show architecture"}
        </button>
      </div>
    </>
  )
}

function ProjectFigure({ project, i }: { project: Project; i: number }) {
  return (
    <PageFrame n={3 + i * 2} part={partNo(project, i)} title={project.name}>
      <p className={s.sheetH}>{project.name}</p>
      <p className={s.sheetKind}>
        {project.kind}, {project.year}
      </p>
      <XRay project={project} idPrefix={`ds-${project.slug}`} />
    </PageFrame>
  )
}

function ProjectSpec({ project, i }: { project: Project; i: number }) {
  return (
    <PageFrame n={4 + i * 2} part={partNo(project, i)} title={project.name}>
      <p className={s.sec}>Function</p>
      <p className={s.fn}>{project.summary}</p>
      <p className={s.sec}>Characteristics</p>
      <table className={s.chars}>
        <tbody>
          {project.sheet.map((row) => (
            <tr key={row.k}>
              <th scope="row">{row.k}</th>
              <td>{row.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.sec}>Interfaces</p>
      <ul className={s.pins}>
        <li>
          <Link href={`/work/${project.slug}`} data-cursor>
            Read the case study
          </Link>
        </li>
        {project.links.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" data-cursor>
              {l.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </PageFrame>
  )
}

/* -------------------------------------------------------------- the book */

/* whether resting on a page turns it: on by default, remembered once the
   reader switches it off */
let autoMem = true
const autoListeners = new Set<() => void>()
const readAuto = () => {
  try {
    return localStorage.getItem(AUTO_KEY) !== "0"
  } catch {
    return autoMem
  }
}
const setAutoTurn = (on: boolean) => {
  autoMem = on
  try {
    localStorage.setItem(AUTO_KEY, on ? "1" : "0")
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
  autoListeners.forEach((l) => l())
}
const useAutoTurn = () =>
  useSyncExternalStore(
    (fn) => {
      autoListeners.add(fn)
      return () => autoListeners.delete(fn)
    },
    readAuto,
    () => true,
  )

const query = "(max-width: 900px)"
const subscribeMq = (fn: () => void) => {
  const mq = window.matchMedia(query)
  mq.addEventListener("change", fn)
  return () => mq.removeEventListener("change", fn)
}
const useNarrow = () =>
  useSyncExternalStore(
    subscribeMq,
    () => window.matchMedia(query).matches,
    () => false,
  )

export function DatasheetBook() {
  const narrow = useNarrow()
  const root = useRef<HTMLDivElement>(null)
  /* until the reader is near, only the cover and contents exist: the eight
     project pages (diagrams, screens) stay out of the first hydration */
  const [live, setLive] = useState(false)
  const [spread, setSpread] = useState(0)
  const [turning, setTurning] = useState(-1)
  const leaves = projects.length
  const maxSpread = leaves
  const swipe = useRef<{ x: number; id: number } | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  /* resting the pointer on a page for a few seconds turns it: the right
     page forward, the left page back. It can be switched off. */
  const [resting, setResting] = useState<{ key: number; side: Side } | null>(null)
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restSide = useRef<Side | null>(null)
  const autoTurn = useAutoTurn()

  const go = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(maxSpread, next))
      if (n === spread) return
      setLive(true)
      /* the leaf in motion rides above both stacks until it lands */
      setTurning(n > spread ? spread : n)
      setSpread(n)
    },
    [maxSpread, spread],
  )

  useEffect(() => {
    const el = root.current
    if (!el || live) return
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setLive(true), {
      rootMargin: "1200px 0px",
    })
    io.observe(el)
    return () => io.disconnect()
    /* narrow swaps the book for the page strip, a different element */
  }, [live, narrow])

  useEffect(
    () => () => {
      if (restTimer.current) clearTimeout(restTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (turning < 0) return
    const t = setTimeout(() => setTurning(-1), 1000)
    return () => clearTimeout(t)
  }, [turning, spread])

  const pages: ReactNode[] = [<Cover key="c" />, <Contents key="t" go={go} />]
  if (live)
    projects.forEach((p, i) => {
      pages.push(<ProjectFigure key={`${p.slug}-f`} project={p} i={i} />)
      pages.push(<ProjectSpec key={`${p.slug}-s`} project={p} i={i} />)
    })

  if (narrow) {
    return (
      <div ref={root} className={s.track} role="region" aria-label="Project datasheets" tabIndex={0}>
        {pages.map((pg, i) => (
          <div key={i} className={s.slot}>
            {pg}
          </div>
        ))}
      </div>
    )
  }

  const stopRest = () => {
    if (restTimer.current) clearTimeout(restTimer.current)
    restTimer.current = null
    restSide.current = null
    setResting(null)
  }
  const onStageMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !autoTurn) return
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    const side: Side = e.clientX > r.left + r.width / 2 ? "right" : "left"
    const can = side === "right" ? spread < maxSpread : spread > 0
    if (!can) {
      if (restTimer.current) stopRest()
      return
    }
    if (restTimer.current && restSide.current === side) return
    if (restTimer.current) clearTimeout(restTimer.current)
    restSide.current = side
    /* a fresh key restarts the fill animation for each rest */
    setResting({ key: Date.now(), side })
    restTimer.current = setTimeout(() => {
      restTimer.current = null
      restSide.current = null
      setResting(null)
      go(spread + (side === "right" ? 1 : -1))
    }, DWELL_MS)
  }
  const toggleAutoTurn = () => {
    if (autoTurn) stopRest()
    setAutoTurn(!autoTurn)
  }

  /* which faces are showing: everything else is inert */
  const leftShown = spread === 0 ? "base-left" : `leaf-${spread - 1}-back`
  const rightShown = !live || spread === maxSpread ? "base-right" : `leaf-${spread}-front`
  const face = (key: string, node: ReactNode, cls: string) => {
    const shown = key === leftShown || key === rightShown
    return (
      <div className={cls} inert={!shown} aria-hidden={!shown}>
        {node}
      </div>
    )
  }

  return (
    <div
      ref={root}
      className={s.book}
      role="region"
      aria-roledescription="book"
      aria-label="Project datasheets"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(spread + 1)
        if (e.key === "ArrowLeft") go(spread - 1)
      }}
    >
      <div
        ref={stage}
        className={s.stage}
        onPointerMove={onStageMove}
        onPointerLeave={stopRest}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, id: e.pointerId }
        }}
        onPointerUp={(e) => {
          const sw = swipe.current
          swipe.current = null
          if (!sw || sw.id !== e.pointerId) return
          const dx = e.clientX - sw.x
          if (Math.abs(dx) > 48) go(spread + (dx < 0 ? 1 : -1))
        }}
      >
        {face("base-left", pages[0], `${s.base} ${s.baseLeft}`)}
        {face("base-right", live ? pages[TOTAL - 1] : pages[1], `${s.base} ${s.baseRight}`)}
        {live && Array.from({ length: leaves }, (_, j) => {
          const flipped = j < spread
          const z = turning === j ? 50 : flipped ? j + 1 : leaves - j + 1
          return (
            <div key={j} className={s.leaf} data-flipped={flipped || undefined} style={{ zIndex: z }}>
              {face(`leaf-${j}-front`, pages[2 * j + 1], `${s.face} ${s.front}`)}
              {face(`leaf-${j}-back`, pages[2 * j + 2], `${s.face} ${s.back}`)}
            </div>
          )
        })}
        {spread > 0 && (
          <div
            className={`${s.corner} ${s.cornerLeft}`}
            onClick={() => go(spread - 1)}
            aria-hidden="true"
          />
        )}
        {spread < maxSpread && (
          <div
            className={`${s.corner} ${s.cornerRight}`}
            onClick={() => go(spread + 1)}
            aria-hidden="true"
          />
        )}
        <div
          key={resting?.key ?? 0}
          className={s.dwell}
          data-on={resting ? "" : undefined}
          data-side={resting?.side ?? "right"}
          style={{ "--dwell": `${DWELL_MS}ms` } as React.CSSProperties}
          aria-hidden="true"
        >
          <i />
        </div>
      </div>

      <div className={s.controls}>
        <button type="button" className={s.ctl} onClick={() => go(spread - 1)} disabled={spread === 0} data-cursor>
          Previous page
        </button>
        <div className={s.mid}>
          <p className={`${s.where} mono`} aria-live="polite">
            {spread === 0 ? "Cover" : projects[spread - 1].name}
            <span>
              {spread + 1} / {maxSpread + 1}
            </span>
          </p>
          <button
            type="button"
            className={s.auto}
            aria-pressed={autoTurn}
            onClick={toggleAutoTurn}
            title="Rest the pointer on a page for five seconds to turn it"
            data-cursor
          >
            <i aria-hidden="true" />
            Turn pages on rest
          </button>
        </div>
        <button
          type="button"
          className={s.ctl}
          onClick={() => go(spread + 1)}
          disabled={spread === maxSpread}
          data-cursor
        >
          Next page
        </button>
      </div>
    </div>
  )
}
