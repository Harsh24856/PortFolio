import * as THREE from "three"
import { clamp, lerp, smooth, vpH, vpW } from "./util"

/* One station per [data-cam] section, in scroll order. The camera rides a
   Catmull-Rom spline through the positions while its aim rides a second
   spline through the targets. Each station also says where the x-ray cut
   stands across the board and which word stands behind it. */
type Station = {
  p: [number, number, number]
  t: [number, number, number]
  fov: number
  /** x of the scan plane: everything left of it is drawn as wireframe */
  scan: number
  /** backdrop word: height of its centre on screen (0 bottom), width share, opacity */
  word: [y: number, w: number, a: number]
}

export const CAM: Station[] = [
  /* 0 hero: the board at three-quarters, the left of it in x-ray */
  { p: [-10.2, 16.4, 23.5], t: [0.9, -1.2, 0.9], fov: 30, scan: -4.4, word: [0.27, 0.9, 0.85] },
  /* 1 assembly: from the front right, low enough to see between the layers */
  { p: [15, 10.5, 20.5], t: [-5.2, 2.6, -0.4], fov: 33, scan: -12, word: [0.5, 0.94, 0.26] },
  /* 2 layout: straight down on the board */
  { p: [0, 19.5, 2.4], t: [0, 0, -1.9], fov: 38, scan: -12, word: [0.84, 0.7, 0.32] },
  /* 3 work: a macro pass low over the left of the board, the cut beside it */
  { p: [-9.6, 2.5, 4.6], t: [-4.2, 0.9, 0.4], fov: 30, scan: -6.9, word: [0.62, 0.94, 0.28] },
  /* 4 datasheets: side on, half the board opened up */
  { p: [12.5, 3.2, 8.5], t: [0.5, 0.6, -0.6], fov: 34, scan: 1.2, word: [0.6, 0.94, 0.3] },
  /* 5 contact: over the right hand, ready to type */
  { p: [4.5, 10.5, 10.5], t: [2.4, 0, -1.2], fov: 36, scan: -12, word: [0.5, 0.94, 0.32] },
  /* 6 footer: the whole board from above and in front */
  { p: [0, 24, 17], t: [0, -4.2, -1.6], fov: 32, scan: -12, word: [0.55, 0.94, 0.5] },
]

export type Rig = {
  prog: number
  smooth: number
  mx: number
  my: number
  tmx: number
  tmy: number
  intro: number
  anchors: { y: number; v: number }[]
}

export function makeRig(): Rig {
  return { prog: 0, smooth: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, anchors: [{ y: 0, v: 0 }] }
}

const v3 = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2])
const curveP = new THREE.CatmullRomCurve3(CAM.map((c) => v3(c.p)), false, "catmullrom", 0.4)
const curveT = new THREE.CatmullRomCurve3(CAM.map((c) => v3(c.t)), false, "catmullrom", 0.4)

/* Every station is composed for a wide frame. On a narrower one the rig
   steps back along its own view axis, far enough that the board's width
   still fits side to side. */
export const narrowness = () => clamp((1.62 - vpW() / vpH()) / 1.16, 0, 1)
function fitAspect(p: THREE.Vector3, t: THREE.Vector3, fov: number) {
  const a = vpW() / vpH()
  if (a >= 1.55) return fov
  const k = Math.min(2.8, Math.pow(1.55 / a, 0.95))
  p.sub(t).multiplyScalar(k).add(t)
  return fov
}

/** the scroll offsets at which each station is reached, and held where a
    section pins */
export function measure(rig: Rig) {
  const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"))
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vpH())
  const out: { y: number; v: number }[] = []
  secs.forEach((el, i) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    if (i === 0) out.push({ y: 0, v: 0 })
    else if (i === secs.length - 1) out.push({ y: maxScroll, v: i })
    else if (el.hasAttribute("data-cam-hold")) {
      out.push({ y: clamp(top, 0, maxScroll), v: i })
      out.push({ y: clamp(top + el.offsetHeight - vpH(), 0, maxScroll), v: i })
    } else out.push({ y: clamp(top + el.offsetHeight * 0.5 - vpH() * 0.5, 0, maxScroll), v: i })
  })
  for (let i = 1; i < out.length; i++) out[i].y = Math.max(out[i].y, out[i - 1].y + 1)
  rig.anchors = out
}

export function progressFor(rig: Rig, y: number) {
  const A = rig.anchors
  if (A.length < 2 || y <= A[0].y) return A[0]?.v ?? 0
  for (let i = 0; i < A.length - 1; i++)
    if (y <= A[i + 1].y) return lerp(A[i].v, A[i + 1].v, (y - A[i].y) / (A[i + 1].y - A[i].y))
  return A[A.length - 1].v
}

/** the scroll offset that lands on station n */
export function scrollFor(rig: Rig, n: number) {
  return rig.anchors.find((a) => a.v === n)?.y ?? 0
}

const _p = new THREE.Vector3()
const _t = new THREE.Vector3()

/** blend any per-station number along the path */
export function station<T extends number>(s: number, pick: (c: Station) => T) {
  const N = CAM.length - 1
  const i = clamp(Math.floor(s), 0, N - 1)
  const f = clamp(s - i, 0, 1)
  const e = f * f * (3 - 2 * f)
  return lerp(pick(CAM[i]), pick(CAM[i + 1]), e)
}

export function applyCamera(rig: Rig, camera: THREE.PerspectiveCamera) {
  const N = CAM.length - 1
  const u = clamp(rig.smooth / N, 0, 1)
  curveP.getPoint(u, _p)
  curveT.getPoint(u, _t)
  let fov = station(rig.smooth, (c) => c.fov)
  fov = fitAspect(_p, _t, fov)

  /* the opening: a long lens easing in from higher and further back */
  const io = 1 - rig.intro
  _p.y += io * 3.5
  _p.z += io * 5
  fov += io * 6

  /* hand-held drift, never enough to break the frame */
  const par = 1 - smooth(1.6, 2, rig.smooth) * (1 - smooth(2, 2.4, rig.smooth)) * 0.7
  _p.x += rig.mx * 0.7 * par
  _p.y += rig.my * 0.45 * par
  _t.x -= rig.mx * 0.18 * par

  camera.position.copy(_p)
  camera.lookAt(_t)
  if (Math.abs(camera.fov - fov) > 1e-4) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }
}
