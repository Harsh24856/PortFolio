import * as THREE from "three"
import { clamp, lerp, smooth, vpH, vpW } from "./util"
import { WORD_Z } from "./layout"
import type { Wordmark } from "./wordmark"

/* One waypoint per [data-cam] section, in scroll order. The camera rides a
   Catmull-Rom spline through the positions while its aim rides a second
   spline through the targets, exactly as the template did. */
export const CAM = [
  { p: [0.0, 4.3, 16.5], t: [0.0, 6.4, -30.0], fov: 38 } /* 0 hero: over the pins, the die ahead */,
  { p: [-8.5, 2.6, 6.5], t: [3.0, 4.2, -26.0], fov: 46 } /* 1 about: low between the banks */,
  { p: [3.0, 3.9, -3.5], t: [-1.5, 7.8, -34.0], fov: 42 } /* 2 work: at the foot of the stack */,
  { p: [-3.4, 7.1, -17.5], t: [1.5, 9.6, -46.0], fov: 42 } /* 3 datasheets: up to the gate */,
  { p: [8.0, 6.4, -24.5], t: [-3.5, 7.4, -44.0], fov: 46 } /* 4 toolkit: beside the fins, core ahead */,
  { p: [0.0, 12.5, -33.0], t: [8.0, 22.0, -86.0], fov: 44 } /* 5 contact: rising toward the wafer */,
  { p: [0.0, 66.0, -10.0], t: [0.0, 0.0, -25.0], fov: 52 } /* 6 footer: the whole die from above */,
] as const

export type Rig = {
  prog: number
  smooth: number
  mx: number
  my: number
  tmx: number
  tmy: number
  intro: number
  anchors: number[]
}

export function makeRig(): Rig {
  return { prog: 0, smooth: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, anchors: [0] }
}

const v3 = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2])
const curveP = new THREE.CatmullRomCurve3(CAM.map((c) => v3(c.p)), false, "catmullrom", 0.42)
const curveT = new THREE.CatmullRomCurve3(CAM.map((c) => v3(c.t)), false, "catmullrom", 0.42)

/* Every waypoint is composed for a wide frame. On a tall one the rig steps
   back along its own view axis and opens up a little instead of letting the
   sides fall away. */
const aspectFix = () => clamp((1.62 - vpW() / vpH()) / 1.05, 0, 1)
const _d = new THREE.Vector3()
function fitAspect(p: THREE.Vector3, t: THREE.Vector3, fov: number) {
  const nf = aspectFix()
  if (nf <= 0) return fov
  _d.subVectors(p, t).normalize()
  p.addScaledVector(_d, nf * 7.5)
  p.y += nf * 2.8
  return fov * (1 + nf * 0.4)
}

/** the scroll offset at which each section's waypoint is reached */
export function measure(rig: Rig) {
  const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-cam]"))
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vpH())
  const anchors = secs.map((el, i) => {
    if (i === 0) return 0
    if (i === secs.length - 1) return maxScroll
    const top = el.getBoundingClientRect().top + window.scrollY
    return clamp(top + el.offsetHeight * 0.5 - vpH() * 0.5, 0, maxScroll)
  })
  for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1)
  rig.anchors = anchors
}

export function progressFor(rig: Rig, y: number) {
  const A = rig.anchors
  if (A.length < 2 || y <= A[0]) return 0
  for (let i = 0; i < A.length - 1; i++) if (y <= A[i + 1]) return i + (y - A[i]) / (A[i + 1] - A[i])
  return A.length - 1
}

const _p = new THREE.Vector3()
const _t = new THREE.Vector3()

export function applyCamera(rig: Rig, camera: THREE.PerspectiveCamera) {
  const N = CAM.length - 1
  const u = clamp(rig.smooth / N, 0, 1)
  curveP.getPoint(u, _p)
  curveT.getPoint(u, _t)
  const i = clamp(Math.floor(rig.smooth), 0, N - 1)
  const f = clamp(rig.smooth - i, 0, 1)
  let fov = lerp(CAM[i].fov, CAM[i + 1].fov, f)
  fov = fitAspect(_p, _t, fov)

  /* the opening dolly: a long lens easing in from further back */
  const io = 1 - rig.intro
  _p.z += io * 6.5
  _p.y += io * 0.8
  fov += io * 8

  /* hand-held drift, never enough to break the frame, gone by the top view */
  const par = (1 - smooth(0, 1.6, rig.smooth) * 0.5) * (1 - smooth(5, 6, rig.smooth))
  _p.x += rig.mx * 0.6 * par
  _p.y += rig.my * 0.32 * par
  _t.x -= rig.mx * 0.2 * par
  _t.y -= rig.my * 0.12 * par

  camera.position.copy(_p)
  camera.lookAt(_t)
  if (Math.abs(camera.fov - fov) > 1e-4) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }
}

/* Size the word to the frame from the hero waypoint, so it always reaches
   edge to edge with its baseline just above the bond wires. */
export function layoutWord(W: Wordmark | null, tmp: THREE.PerspectiveCamera) {
  if (!W) return
  const c = CAM[0]
  const hp = v3(c.p)
  const ht = v3(c.t)
  tmp.fov = fitAspect(hp, ht, c.fov)
  tmp.aspect = vpW() / vpH()
  tmp.position.copy(hp)
  tmp.lookAt(ht)
  tmp.updateProjectionMatrix()
  tmp.updateMatrixWorld(true)
  const hit = (nx: number, ny: number) => {
    const v = new THREE.Vector3(nx, ny, 0.5).unproject(tmp).sub(tmp.position).normalize()
    return tmp.position.clone().addScaledVector(v, (WORD_Z - tmp.position.z) / v.z)
  }
  const L = hit(-1, 0)
  const R = hit(1, 0)
  const narrow = vpW() / vpH() < 1.05
  const fill = narrow ? 0.9 : 0.92
  const s = ((R.x - L.x) * fill) / W.ink.w
  const base = hit(0, narrow ? -0.1 : -0.56)
  W.group.scale.setScalar(s)
  W.group.position.set(-W.ink.cx * s, base.y, WORD_Z)
}
