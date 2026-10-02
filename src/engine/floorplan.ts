import { canvas2d, mulberry32 } from "./util"
import { DIE, DIE_D, DIE_W, HEATSINK, PODIUM, SRAM_L, SRAM_R, STAIRS, SYSTOLIC } from "./layout"

/* The die shot, drawn once at boot: an albedo of dark functional regions
   (standard-cell rows, memory arrays, the array processor) and an emissive
   map of the metal routing. The routes are generated as world-space
   polylines first and then drawn, so the packets that travel them later run
   exactly on the lines you can see. */

export type Route = { pts: [number, number][]; y: number; blue: boolean; len: number }

type Rect = { x0: number; x1: number; z0: number; z1: number }

export type Floorplan = {
  albedo: HTMLCanvasElement
  emissive: HTMLCanvasElement
  routes: Route[]
}

const inside = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1
const PODIUM_FOOT: Rect = { x0: PODIUM.x0, x1: PODIUM.x1, z0: PODIUM.z0, z1: STAIRS.zFront }

function routeLen(pts: [number, number][]) {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
  return L
}

export function buildFloorplan(size: number): Floorplan {
  const W = size
  const H = Math.round((size * DIE_D) / DIE_W)
  const px = (x: number) => ((x - DIE.x0) / DIE_W) * W
  const pz = (z: number) => ((z - DIE.z0) / DIE_D) * H
  const k = W / DIE_W /* pixels per metre */
  const rnd = mulberry32(20260)

  /* ------------------------------------------------------------ albedo */
  const albedo = canvas2d(W, H)
  const a = albedo.getContext("2d")!
  a.fillStyle = "#0b0c0f"
  a.fillRect(0, 0, W, H)

  /* standard-cell rows everywhere: fine horizontal striations in patches */
  for (let i = 0; i < 140; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const w = (2 + rnd() * 9) * k
    const h = (1.5 + rnd() * 6) * k
    const shade = 12 + Math.floor(rnd() * 10)
    a.fillStyle = `rgb(${shade},${shade + 1},${shade + 4})`
    a.fillRect(x, y, w, h)
    a.fillStyle = "rgba(255,255,255,0.025)"
    for (let yy = y; yy < y + h; yy += Math.max(2, k * 0.22)) a.fillRect(x, yy, w, 1)
  }

  const region = (r: Rect, cell: number, base: string, line: string) => {
    const x0 = px(r.x0)
    const y0 = pz(r.z0)
    const w = px(r.x1) - x0
    const h = pz(r.z1) - y0
    a.fillStyle = base
    a.fillRect(x0, y0, w, h)
    a.fillStyle = line
    const step = cell * k
    for (let x = x0; x <= x0 + w; x += step) a.fillRect(x, y0, 1, h)
    for (let y = y0; y <= y0 + h; y += step) a.fillRect(x0, y, w, 1)
    a.strokeStyle = "rgba(255,255,255,0.14)"
    a.lineWidth = 2
    a.strokeRect(x0, y0, w, h)
  }
  region(SRAM_L, 0.6, "#101218", "rgba(160,190,255,0.06)")
  region(SRAM_R, 0.6, "#101218", "rgba(160,190,255,0.06)")
  region(SYSTOLIC, 1.0, "#0e1015", "rgba(255,255,255,0.05)")
  region(HEATSINK, 1.2, "#0c0d10", "rgba(255,255,255,0.035)")
  region({ x0: PODIUM.x0, x1: PODIUM.x1, z0: PODIUM.z0, z1: PODIUM.z1 }, 0.4, "#0d0f13", "rgba(255,255,255,0.03)")

  /* the I/O ring: a band of pads around the edge */
  a.fillStyle = "#15171c"
  const ringIn = 2.6
  a.fillRect(0, 0, W, ringIn * k)
  a.fillRect(0, H - ringIn * k, W, ringIn * k)
  a.fillRect(0, 0, ringIn * k, H)
  a.fillRect(W - ringIn * k, 0, ringIn * k, H)

  /* ------------------------------------------------------------ routes */
  const routes: Route[] = []
  const add = (pts: [number, number][], blue = false, y = 0) => {
    routes.push({ pts, y, blue, len: routeLen(pts) })
  }

  /* the avenue: lanes that lead the eye from the edge to the first step */
  for (const x of [-3.6, -2.4, -1.2, 1.2, 2.4, 3.6]) add([[x, DIE.z1 - 0.6], [x, STAIRS.zFront + 0.2]], Math.abs(x) < 2, 0)
  /* the I/O ring just inside the pads */
  const ri = ringIn + 0.6
  add([[DIE.x0 + ri, DIE.z1 - ri], [DIE.x1 - ri, DIE.z1 - ri]], false)
  add([[DIE.x0 + ri, DIE.z0 + ri], [DIE.x0 + ri, DIE.z1 - ri]], false)
  add([[DIE.x1 - ri, DIE.z1 - ri], [DIE.x1 - ri, DIE.z0 + ri]], false)
  add([[DIE.x0 + ri, DIE.z0 + ri], [DIE.x1 - ri, DIE.z0 + ri]], false)

  /* memory buses: each bank feeds the avenue */
  for (const bank of [SRAM_L, SRAM_R]) {
    const sx = bank.x0 < 0 ? bank.x1 : bank.x0
    const tx = bank.x0 < 0 ? -4.4 : 4.4
    for (let i = 0; i < 4; i++) {
      const z = bank.z1 - 2 - i * 4.4
      const zj = -1 - i * 1.5
      add([[sx, z], [(sx + tx) / 2, z], [(sx + tx) / 2, zj], [tx, zj]], i === 1)
    }
  }
  /* the array processor and the heatsink side tie back toward the plateau */
  for (let i = 0; i < 5; i++) {
    const z = SYSTOLIC.z1 - 2 - i * 4
    add([[SYSTOLIC.x0, z], [PODIUM.x1 + 1.5, z], [PODIUM.x1 + 1.5, z + 1.6], [PODIUM.x1 + 0.2, z + 1.6]], i % 2 === 0)
  }
  for (let i = 0; i < 4; i++) {
    const z = HEATSINK.z1 - 3 - i * 5
    add([[HEATSINK.x1, z], [PODIUM.x0 - 1.5, z], [PODIUM.x0 - 1.5, z - 1.4], [PODIUM.x0 - 0.2, z - 1.4]])
  }
  /* on the plateau: the bus between the gate and the core */
  for (const x of [-9, -6, 6, 9]) add([[x, PODIUM.z1 - 0.8], [x, -39.5]], Math.abs(x) === 6, PODIUM.y)
  add([[-11, PODIUM.z1 - 0.6], [11, PODIUM.z1 - 0.6]], true, PODIUM.y)

  /* the fill: random Manhattan routing over open ground */
  const open = (x: number, z: number) => !inside(PODIUM_FOOT, x, z) && x > DIE.x0 + 3 && x < DIE.x1 - 3 && z > DIE.z0 + 3 && z < DIE.z1 - 3
  for (let i = 0; i < 70; i++) {
    let x = DIE.x0 + 3 + rnd() * (DIE_W - 6)
    let z = DIE.z0 + 3 + rnd() * (DIE_D - 6)
    if (!open(x, z)) continue
    const pts: [number, number][] = [[x, z]]
    for (let s = 0; s < 3 + Math.floor(rnd() * 3); s++) {
      const horiz = s % 2 === 0
      const d = (rnd() < 0.5 ? -1 : 1) * (2 + rnd() * 9)
      const nx = horiz ? x + d : x
      const nz = horiz ? z : z + d
      if (!open(nx, nz)) break
      x = nx
      z = nz
      pts.push([x, z])
    }
    if (pts.length > 1) add(pts, rnd() < 0.18)
  }

  /* ---------------------------------------------------------- emissive */
  const emissive = canvas2d(W, H)
  const e = emissive.getContext("2d")!
  e.fillStyle = "#000"
  e.fillRect(0, 0, W, H)
  e.lineCap = "square"
  e.lineJoin = "miter"
  for (const r of routes) {
    e.beginPath()
    r.pts.forEach(([x, z], i) => (i ? e.lineTo(px(x), pz(z)) : e.moveTo(px(x), pz(z))))
    e.strokeStyle = r.blue ? "rgba(122,167,255,0.9)" : "rgba(235,240,250,0.42)"
    e.lineWidth = Math.max(1.2, k * (r.blue ? 0.09 : 0.06))
    e.stroke()
    /* a via at every bend */
    e.fillStyle = r.blue ? "rgba(170,200,255,0.95)" : "rgba(255,255,255,0.6)"
    for (const [x, z] of r.pts) e.fillRect(px(x) - k * 0.09, pz(z) - k * 0.09, k * 0.18, k * 0.18)
  }
  /* pads around the edge */
  e.fillStyle = "rgba(220,228,240,0.55)"
  for (let x = DIE.x0 + 3; x < DIE.x1 - 2; x += 2) {
    e.fillRect(px(x) - k * 0.5, pz(DIE.z1 - 1.3) - k * 0.5, k, k)
    e.fillRect(px(x) - k * 0.5, pz(DIE.z0 + 1.3) - k * 0.5, k, k)
  }
  for (let z = DIE.z0 + 3; z < DIE.z1 - 2; z += 2) {
    e.fillRect(px(DIE.x0 + 1.3) - k * 0.5, pz(z) - k * 0.5, k, k)
    e.fillRect(px(DIE.x1 - 1.3) - k * 0.5, pz(z) - k * 0.5, k, k)
  }
  /* memory cells catch a little light of their own */
  for (const bank of [SRAM_L, SRAM_R]) {
    for (let i = 0; i < 90; i++) {
      const x = bank.x0 + rnd() * (bank.x1 - bank.x0)
      const z = bank.z0 + rnd() * (bank.z1 - bank.z0)
      e.fillStyle = rnd() < 0.3 ? "rgba(122,167,255,0.5)" : "rgba(255,255,255,0.18)"
      e.fillRect(px(x), pz(z), k * 0.5, k * 0.5)
    }
  }

  /* packets only ride routes that are not hidden under the plateau */
  const visible = routes.filter((r) => r.y > 0 || r.pts.every(([x, z]) => !inside(PODIUM_FOOT, x, z)))
  return { albedo, emissive, routes: visible }
}
