import * as THREE from "three"
import { mulberry32 } from "./util"
import type { Route } from "./floorplan"

/* Packets: short bright bars that run the routing, the leaf fall of the
   template turned into traffic. Each one rides a route end to end, then
   picks another. A burst of fast ones is sent off toward the edge of the die
   when a message goes out. */

type Packet = { r: number; s: number; v: number; len: number; burst: boolean }

export type Packets = {
  mesh: THREE.InstancedMesh
  update(dt: number, reduce: boolean): void
  burst(n: number): void
}

const BLUE = new THREE.Color().setRGB(0.9, 1.6, 4.2, THREE.LinearSRGBColorSpace)
const WHITE = new THREE.Color().setRGB(2.4, 2.55, 2.9, THREE.LinearSRGBColorSpace)

export function buildPackets(scene: THREE.Scene, routes: Route[], count: number): Packets {
  const rnd = mulberry32(99)
  const usable = routes.filter((r) => r.len > 4)
  const edgeRoutes = usable
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.y === 0 && r.pts.some(([, z]) => z > 4))
    .map(({ i }) => i)

  const total = count + 24
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), total)
  mesh.frustumCulled = false
  const packets: Packet[] = []
  const spawn = (p: Packet, burst = false) => {
    p.r = burst && edgeRoutes.length ? edgeRoutes[Math.floor(rnd() * edgeRoutes.length)] : Math.floor(rnd() * usable.length)
    p.s = burst ? 0 : rnd() * usable[p.r].len
    p.v = burst ? 14 + rnd() * 8 : 2.2 + rnd() * 4.5
    p.len = burst ? 1.2 : 0.4 + rnd() * 0.5
    p.burst = burst
  }
  for (let i = 0; i < total; i++) {
    const p: Packet = { r: 0, s: 0, v: 0, len: 0, burst: false }
    spawn(p)
    if (i >= count) p.r = -1 /* burst slots sleep until needed */
    packets.push(p)
    mesh.setColorAt(i, i < count && usable[p.r]?.blue ? BLUE : WHITE)
  }
  scene.add(mesh)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3()
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0)

  function place(i: number, p: Packet) {
    const R = usable[p.r]
    let s = p.s
    for (let k = 1; k < R.pts.length; k++) {
      const [x0, z0] = R.pts[k - 1]
      const [x1, z1] = R.pts[k]
      const seg = Math.abs(x1 - x0) + Math.abs(z1 - z0)
      if (s <= seg || k === R.pts.length - 1) {
        const f = seg > 0 ? Math.min(s / seg, 1) : 0
        pos.set(x0 + (x1 - x0) * f, R.y + 0.03, z0 + (z1 - z0) * f)
        const alongX = Math.abs(x1 - x0) > 0
        scl.set(alongX ? p.len : 0.07, 0.035, alongX ? 0.07 : p.len)
        mesh.setMatrixAt(i, m.compose(pos, q, scl))
        return
      }
      s -= seg
    }
  }

  return {
    mesh,
    update(dt, reduce) {
      for (let i = 0; i < packets.length; i++) {
        const p = packets[i]
        if (p.r < 0) {
          mesh.setMatrixAt(i, hidden)
          continue
        }
        if (!reduce || p.burst) p.s += p.v * dt
        if (p.s > usable[p.r].len) {
          if (p.burst) {
            p.r = -1
            p.burst = false
            mesh.setMatrixAt(i, hidden)
            continue
          }
          spawn(p)
          p.s = 0
          mesh.setColorAt(i, usable[p.r].blue ? BLUE : WHITE)
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        }
        place(i, p)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
    burst(n) {
      let fired = 0
      for (let i = count; i < packets.length && fired < n; i++) {
        if (packets[i].r >= 0) continue
        spawn(packets[i], true)
        mesh.setColorAt(i, BLUE)
        fired++
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    },
  }
}
