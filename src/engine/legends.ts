import { capTop } from "./keycap"
import { KEYS, TOOL_KEYS, keyIndex, type KeyDef } from "./board"
import { canvas2d } from "./util"

/* Every legend on the board, printed into one atlas. Each key owns two
   cells shaped like its top face: the printed legend, and the name of the
   tool it stands for when the toolkit lights its group. The shader blends
   between the two per key. Ink colour lives in the atlas, coverage in its
   alpha, so the cap colour underneath can change freely. */

export const ATLAS = 2048
const CELL_H = 128

export type Rect = [u0: number, v0: number, du: number, dv: number]

const INK_LIGHT = "#2b2c30"
const INK_DARK = "#c9ccd2"
const INK_ACCENT = "#eef2ff"

function inkFor(k: KeyDef) {
  return k.kind === "alpha" ? INK_LIGHT : k.kind === "accent" ? INK_ACCENT : INK_DARK
}

function arrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, dir: string) {
  const rot = { "↑": 0, "→": Math.PI / 2, "↓": Math.PI, "←": -Math.PI / 2 }[dir] ?? 0
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.lineWidth = s * 0.13
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(0, s * 0.5)
  ctx.lineTo(0, -s * 0.48)
  ctx.moveTo(-s * 0.32, -s * 0.16)
  ctx.lineTo(0, -s * 0.5)
  ctx.lineTo(s * 0.32, -s * 0.16)
  ctx.stroke()
  ctx.restore()
}

/* wrap a tool name onto at most two lines that fit the cell */
function fitLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, family: string, size: number) {
  const words = text.split(" ")
  let s = size
  for (; s > 12; s -= 1) {
    ctx.font = `600 ${s}px ${family}`
    if (words.length === 1) {
      if (ctx.measureText(text).width <= maxW) return { lines: [text], size: s }
      continue
    }
    /* best split into two lines */
    let best: string[] | null = null
    let bestW = Infinity
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ")
      const b = words.slice(i).join(" ")
      const wMax = Math.max(ctx.measureText(a).width, ctx.measureText(b).width)
      if (wMax < bestW) {
        bestW = wMax
        best = [a, b]
      }
    }
    if (ctx.measureText(text).width <= maxW && s >= size - 2) return { lines: [text], size: s }
    if (best && bestW <= maxW) return { lines: best, size: s }
  }
  return { lines: [text], size: s }
}

export function buildLegends(family: string, toolNames: string[][]) {
  const cv = canvas2d(ATLAS, ATLAS)
  const ctx = cv.getContext("2d")!
  ctx.clearRect(0, 0, ATLAS, ATLAS)
  ctx.textBaseline = "alphabetic"

  /* lay the cells out in rows, wrapping at the atlas edge */
  let px = 0
  let py = 0
  const place = (w: number) => {
    if (px + w > ATLAS) {
      px = 0
      py += CELL_H
    }
    const r = { x: px, y: py, w, h: CELL_H }
    px += w + 2
    return r
  }

  const rectsA: Rect[] = []
  const rectsB: Rect[] = []
  const toolOf = new Map<number, { name: string; group: number }>()
  TOOL_KEYS.forEach((codes, g) =>
    codes.forEach((c, i) => {
      const k = keyIndex.get(c)
      const name = toolNames[g]?.[i]
      if (k !== undefined && name) toolOf.set(k, { name, group: g })
    }),
  )

  const cells = KEYS.map((k) => {
    const t = capTop(k.w)
    return Math.round((CELL_H * t.w) / t.d)
  })

  KEYS.forEach((k, i) => {
    const r = place(cells[i])
    rectsA.push([r.x / ATLAS, r.y / ATLAS, r.w / ATLAS, r.h / ATLAS])
    const ink = inkFor(k)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    const padX = r.h * 0.17
    const isArrow = k.label.length === 1 && "←→↑↓".includes(k.label)
    const isWord = k.label.length > 1
    if (isArrow) {
      arrow(ctx, r.x + r.w / 2, r.y + r.h / 2, r.h * 0.34, k.label)
    } else if (isWord) {
      /* modifiers: small, set low on the left */
      ctx.font = `500 ${Math.round(r.h * 0.19)}px ${family}`
      ctx.fillText(k.label, r.x + padX, r.y + r.h * 0.8)
    } else if (k.shift) {
      ctx.font = `500 ${Math.round(r.h * 0.26)}px ${family}`
      ctx.fillText(k.shift, r.x + padX, r.y + r.h * 0.38)
      ctx.fillText(k.label, r.x + padX, r.y + r.h * 0.76)
    } else if (k.label) {
      ctx.font = `500 ${Math.round(r.h * 0.34)}px ${family}`
      ctx.fillText(k.label, r.x + padX, r.y + r.h * 0.46)
    }
  })

  /* the tool cells start on a fresh row */
  px = 0
  py += CELL_H
  const blank = place(8)
  const blankRect: Rect = [blank.x / ATLAS, blank.y / ATLAS, blank.w / ATLAS, blank.h / ATLAS]
  KEYS.forEach((k, i) => {
    const tool = toolOf.get(i)
    if (!tool) {
      rectsB.push(blankRect)
      return
    }
    const r = place(cells[i])
    rectsB.push([r.x / ATLAS, r.y / ATLAS, r.w / ATLAS, r.h / ATLAS])
    ctx.fillStyle = "#ffffff"
    const fit = fitLines(ctx, tool.name, r.w * 0.9, family, Math.round(r.h * 0.2))
    ctx.font = `600 ${fit.size}px ${family}`
    ctx.textAlign = "center"
    const lh = fit.size * 1.08
    const y0 = r.y + r.h / 2 - ((fit.lines.length - 1) * lh) / 2 + fit.size * 0.34
    fit.lines.forEach((ln, j) => ctx.fillText(ln, r.x + r.w / 2, y0 + j * lh))
    ctx.textAlign = "left"
  })

  return { canvas: cv, rectsA, rectsB, toolOf }
}
