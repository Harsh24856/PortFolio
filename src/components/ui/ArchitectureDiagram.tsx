import type { Project } from "@/content/projects"
import s from "./ArchitectureDiagram.module.css"

const W = 214
const H = 104
const BW = 170
const BH = 58
const PAD = 26

type Pt = { x: number; y: number }

/* A system diagram drawn the way the die is: boxes on a grid, connections
   routed as right-angled traces through the channels between columns, with
   a via at every bend and a packet running each line. */
export function ArchitectureDiagram({
  project,
  className = "",
  animate = true,
  idPrefix,
}: {
  project: Project
  className?: string
  animate?: boolean
  idPrefix?: string
}) {
  const { cols, rows, nodes, edges } = project.arch
  const vw = PAD * 2 + (cols - 1) * W + BW
  const vh = PAD * 2 + (rows - 1) * H + BH
  const box = (c: number, r: number) => ({ x: PAD + c * W, y: PAD + r * H })
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const pid = idPrefix ?? `arch-${project.slug}`

  const routes = edges.flatMap((e, i) => {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    if (!a || !b) return []
    const A = box(a.at[0], a.at[1])
    const B = box(b.at[0], b.at[1])
    let d: string
    let vias: Pt[] = []
    let labelAt: Pt
    if (a.at[0] === b.at[0]) {
      const x = A.x + BW / 2
      const down = B.y > A.y
      const y1 = down ? A.y + BH : A.y
      const y2 = down ? B.y : B.y + BH
      d = `M${x} ${y1}V${y2}`
      labelAt = { x: x + 8, y: (y1 + y2) / 2 + 4 }
    } else {
      const right = B.x > A.x
      const sx = right ? A.x + BW : A.x
      const tx = right ? B.x : B.x + BW
      const sy = A.y + BH / 2
      const ty = B.y + BH / 2
      const mx = Math.round((sx + tx) / 2)
      d = sy === ty ? `M${sx} ${sy}H${tx}` : `M${sx} ${sy}H${mx}V${ty}H${tx}`
      if (sy !== ty) vias = [{ x: mx, y: sy }, { x: mx, y: ty }]
      labelAt = { x: mx + 6, y: sy === ty ? sy - 8 : (sy + ty) / 2 + 4 }
    }
    return [{ key: `${e.from}-${e.to}`, d, vias, label: e.label, labelAt, i }]
  })

  const titleId = `${pid}-t`
  const descId = `${pid}-d`
  const sentence = edges
    .map((e) => {
      const a = byId.get(e.from)
      const b = byId.get(e.to)
      return a && b ? `${a.label} connects to ${b.label}${e.label ? ` over ${e.label}` : ""}.` : ""
    })
    .join(" ")

  return (
    <svg
      className={`${s.diagram} ${className}`}
      viewBox={`0 0 ${vw} ${vh}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>{`${project.name} architecture`}</title>
      <desc id={descId}>{sentence}</desc>

      <g className={s.traces}>
        {routes.map((r) => (
          <g key={r.key}>
            <path id={`${pid}-${r.i}`} d={r.d} className={s.trace} />
            {r.vias.map((v, j) => (
              <circle key={j} cx={v.x} cy={v.y} r={2.6} className={s.via} />
            ))}
            {r.label && (
              <text x={r.labelAt.x} y={r.labelAt.y} className={s.edgeLabel}>
                {r.label}
              </text>
            )}
            {animate && (
              <circle r={2.4} className={s.packet}>
                <animateMotion dur={`${2.4 + (r.i % 3) * 0.7}s`} begin={`${r.i * 0.45}s`} repeatCount="indefinite">
                  <mpath href={`#${pid}-${r.i}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        ))}
      </g>

      {nodes.map((n) => {
        const p = box(n.at[0], n.at[1])
        return (
          <g key={n.id} className={s.node} data-kind={n.kind} transform={`translate(${p.x} ${p.y})`}>
            <rect width={BW} height={BH} rx={4} className={s.box} />
            {n.kind === "data" && <path d={`M0 10H${BW}`} className={s.band} />}
            {n.kind === "model" && <path d={`M${BW - 18} 8h10v10h-10z`} className={s.glyph} />}
            <text x={14} y={n.sub ? 26 : 34} className={s.label}>
              {n.label}
            </text>
            {n.sub && (
              <text x={14} y={44} className={s.sub}>
                {n.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
