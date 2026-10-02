import * as THREE from "three"

/* A keycap, lofted ring by ring: a rounded footprint that draws in as it
   rises (the draft of the walls), a soft fillet at the rim, and a top that
   dips into a cylindrical dish, low in the middle of the front and back
   edges and high at the sides, the way a sculpted cap sits under a finger.
   The top carries UVs across its face for the legend; the walls carry the
   same planar UVs, which fall outside the legend's cell and so stay clean. */

export const CAP = {
  /** gap left between neighbouring caps' footprints */
  gap: 0.055,
  /** depth of a 1u footprint */
  depth: 0.945,
  height: 0.44,
  /** how far the top face draws in from the footprint, each side */
  drawX: 0.135,
  drawFront: 0.15,
  drawBack: 0.1,
  dish: 0.045,
  rBottom: 0.07,
  rTop: 0.11,
}

/** top-face size for a cap of width w, used to proportion its legend cell */
export function capTop(w: number) {
  return { w: w - CAP.gap - CAP.drawX * 2, d: CAP.depth - CAP.drawFront - CAP.drawBack }
}

function ring(hw: number, hd: number, r: number, seg: number, nx: number, nz: number, out: [number, number][]) {
  out.length = 0
  const cx = hw - r
  const cz = hd - r
  const centres: [number, number][] = [
    [cx, cz],
    [-cx, cz],
    [-cx, -cz],
    [cx, -cz],
  ]
  for (let q = 0; q < 4; q++) {
    const [ox, oz] = centres[q]
    for (let j = 0; j <= seg; j++) {
      const a = (q * Math.PI) / 2 + (j / seg) * (Math.PI / 2)
      out.push([ox + Math.cos(a) * r, oz + Math.sin(a) * r])
    }
    /* the straight run to the next corner: along x after the front and back
       corners, along z after the left and right ones */
    const [nxp, nzp] = centres[(q + 1) % 4]
    const a1 = ((q + 1) * Math.PI) / 2
    const from: [number, number] = [ox + Math.cos(a1) * r, oz + Math.sin(a1) * r]
    const to: [number, number] = [nxp + Math.cos(a1) * r, nzp + Math.sin(a1) * r]
    const n = q % 2 === 0 ? nx : nz
    for (let j = 1; j <= n; j++) {
      const t = j / (n + 1)
      out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t])
    }
  }
  return out
}

export function buildCap(w: number): THREE.BufferGeometry {
  const seg = 4
  const nx = Math.max(3, Math.round(w * 5))
  const nz = 4
  const C = CAP
  const bw = w - C.gap
  const bd = C.depth
  const top = capTop(w)
  /* the top sits a touch back from the footprint's centre */
  const topZ = (C.drawFront - C.drawBack) * -0.5
  const htw = top.w / 2
  /* a wide cap keeps the same finger-width dish, so its trough is shallower */
  const dishD = C.dish / Math.pow(w, 0.55)
  const dish = (x: number) => dishD * (1 - Math.min(1, (x / htw) ** 2))

  /* wall profile: [share of the draw-in, height]; the last two rings round
     the rim over into the top */
  const wall: [number, number][] = [
    [0, 0],
    [0.42, 0.46],
    [0.74, 0.8],
    [0.9, 0.93],
    [0.97, 0.985],
  ]
  const P: number[] = []
  const UV: number[] = []
  const idx: number[] = []
  const pts: [number, number][] = []
  let perRing = 0
  const uvOf = (x: number, z: number) => [(x + htw) / top.w, (z - topZ + top.d / 2) / top.d]
  const pushRing = (hw: number, hd: number, r: number, zOff: number, yOf: (x: number) => number) => {
    ring(hw, hd, r, seg, nx, nz, pts)
    perRing = pts.length
    for (const [x, z0] of pts) {
      const z = z0 + zOff
      P.push(x, yOf(x), z)
      const [u, v] = uvOf(x, z)
      UV.push(u, 1 - v)
    }
  }
  for (const [s, h] of wall) {
    const hw = bw / 2 + (htw + 0.012 - bw / 2) * s
    const hdF = bd / 2 + (top.d / 2 + 0.012 - bd / 2) * s
    const r = C.rBottom + (C.rTop - C.rBottom) * s
    pushRing(hw, hdF, r, topZ * s, (x) => h * C.height - dish(x * (htw / hw)) * s ** 4)
  }
  /* the rim, then the dish in concentric steps to the centre */
  const steps = [1, 0.8, 0.58, 0.36, 0.16]
  for (const f of steps) {
    pushRing(htw * f, (top.d / 2) * f, C.rTop * f + 0.0001, topZ, (x) => C.height - dish(x))
  }
  const rings = wall.length + steps.length
  for (let k = 0; k < rings - 1; k++) {
    const a = k * perRing
    const b = (k + 1) * perRing
    for (let i = 0; i < perRing; i++) {
      const j = (i + 1) % perRing
      idx.push(a + i, b + i, a + j, a + j, b + i, b + j)
    }
  }
  /* centre of the dish */
  const centre = P.length / 3
  P.push(0, C.height - dishD, topZ)
  const [cu, cv] = uvOf(0, topZ)
  UV.push(cu, 1 - cv)
  const last = (rings - 1) * perRing
  for (let i = 0; i < perRing; i++) idx.push(last + i, centre, last + ((i + 1) % perRing))
  /* the open underside, closed so an exploded cap never shows its inside */
  const under = P.length / 3
  P.push(0, 0.02, 0)
  UV.push(-1, -1)
  for (let i = 0; i < perRing; i++) idx.push(under, i, (i + 1) % perRing)

  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3))
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2))
  g.setIndex(idx)
  orient(g)
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

/* The ring direction decides which way the faces point. Rather than reason
   it out per corner, check one wall face against the outward direction and
   flip the whole index buffer if it faces in. */
function orient(g: THREE.BufferGeometry) {
  const p = g.attributes.position
  const ix = g.index!
  const a = new THREE.Vector3().fromBufferAttribute(p, ix.getX(0))
  const b = new THREE.Vector3().fromBufferAttribute(p, ix.getX(1))
  const c = new THREE.Vector3().fromBufferAttribute(p, ix.getX(2))
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a))
  const out = new THREE.Vector3(a.x + b.x + c.x, 0, a.z + b.z + c.z)
  if (n.dot(out) < 0) {
    const arr = ix.array as Uint16Array | Uint32Array
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i + 1]
      arr[i + 1] = arr[i + 2]
      arr[i + 2] = t
    }
    ix.needsUpdate = true
  }
}
