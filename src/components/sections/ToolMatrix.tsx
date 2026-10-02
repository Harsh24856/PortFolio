"use client"

import { useState } from "react"
import { projects } from "@/content/projects"
import { alsoFluent, toolGroups } from "@/content/toolkit"
import s from "./Toolkit.module.css"

type Sel = { kind: "tool"; name: string } | { kind: "project"; slug: string } | null

/* A crossbar: tools run along the rows, projects up the columns, and a via
   sits at every crossing where one ran on the other. Selecting a row or a
   column lights its traces and every via on them. It is a real table, so it
   reads as one without the drawing. */
export function ToolMatrix() {
  const [hover, setHover] = useState<Sel>(null)
  const [pinned, setPinned] = useState<Sel>(null)
  const sel = hover ?? pinned

  const same = (a: Sel, b: Sel) =>
    !!a &&
    !!b &&
    ((a.kind === "tool" && b.kind === "tool" && a.name === b.name) ||
      (a.kind === "project" && b.kind === "project" && a.slug === b.slug))
  const toggle = (v: Sel) => setPinned((p) => (same(p, v) ? null : v))

  const toolLit = (name: string, used: string[]) =>
    !!sel && ((sel.kind === "tool" && sel.name === name) || (sel.kind === "project" && used.includes(sel.slug)))
  const projLit = (slug: string) =>
    !!sel &&
    ((sel.kind === "project" && sel.slug === slug) ||
      (sel.kind === "tool" && toolGroups.some((g) => g.tools.some((t) => t.name === sel.name && t.used.includes(slug)))))
  const cellLit = (name: string, slug: string) =>
    !!sel && ((sel.kind === "tool" && sel.name === name) || (sel.kind === "project" && sel.slug === slug))

  return (
    <div className={s.wrap} data-active={sel ? "" : undefined}>
      <table className={s.matrix}>
        <caption className="sr-only">Tools used in each project. A filled via means the tool was used.</caption>
        <colgroup>
          <col className={s.colTool} />
          {projects.map((p) => (
            <col key={p.slug} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td className={s.corner} />
            {projects.map((p) => (
              <th key={p.slug} scope="col" className={s.projHead} data-lit={projLit(p.slug) || undefined}>
                <button
                  type="button"
                  data-cursor
                  aria-pressed={same(pinned, { kind: "project", slug: p.slug })}
                  onPointerEnter={() => setHover({ kind: "project", slug: p.slug })}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => toggle({ kind: "project", slug: p.slug })}
                >
                  <span className={s.projName}>{p.name}</span>
                  <span className="num">{p.year}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        {toolGroups.map((g) => (
          <tbody key={g.name}>
            <tr className={s.groupRow}>
              <th scope="rowgroup" colSpan={projects.length + 1}>
                {g.name}
              </th>
            </tr>
            {g.tools.map((t) => (
              <tr key={t.name} className={s.row} data-lit={toolLit(t.name, t.used) || undefined}>
                <th scope="row" className={s.toolHead}>
                  <button
                    type="button"
                    data-cursor
                    aria-pressed={same(pinned, { kind: "tool", name: t.name })}
                    onPointerEnter={() => setHover({ kind: "tool", name: t.name })}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => toggle({ kind: "tool", name: t.name })}
                  >
                    {t.name}
                  </button>
                </th>
                {projects.map((p) => {
                  const used = t.used.includes(p.slug)
                  return (
                    <td
                      key={p.slug}
                      className={s.cell}
                      data-used={used || undefined}
                      data-lit={(used && cellLit(t.name, p.slug)) || undefined}
                      data-col-lit={projLit(p.slug) || undefined}
                    >
                      <span className={s.via} aria-hidden="true" />
                      <span className="sr-only">{used ? "Used" : "Not used"}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className={s.also}>
        <span className={s.alsoK}>Also fluent in</span> {alsoFluent.join(", ")}.
      </p>
    </div>
  )
}
