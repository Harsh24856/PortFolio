export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const sat = (v: number) => clamp(v, 0, 1)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (e0: number, e1: number, x: number) => {
  const t = sat((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
/** frame-rate independent damping toward a target */
export const damp = (cur: number, to: number, rate: number, dt: number) => lerp(cur, to, 1 - Math.exp(-rate * dt))

export function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* The layout viewport, not the window: on a phone innerWidth can run wider
   than what CSS lays out against, which drops the scene's right edge. */
export const vpW = () => document.documentElement.clientWidth || innerWidth
export const vpH = () => document.documentElement.clientHeight || innerHeight

export const canvas2d = (w: number, h: number) => {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

export const REDUCE = () => matchMedia("(prefers-reduced-motion: reduce)").matches
export const nextFrame = () => new Promise<void>((r) => setTimeout(r, 16))
