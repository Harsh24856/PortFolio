import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { canvas2d, mulberry32 } from "./util"
import type { Floorplan } from "./floorplan"
import {
  CORE,
  DIE,
  DIE_D,
  DIE_W,
  FINS,
  GATE,
  HEATSINK,
  PODIUM,
  SRAM_L,
  SRAM_R,
  STAIRS,
  SYSTOLIC,
  WAFER,
  dieU,
  dieV,
} from "./layout"

/* Every value that animates per frame is held here, so the loop only
   touches numbers and instance buffers, never the scene graph. */
export type WorldState = {
  uniforms: {
    uCursor: { value: THREE.Vector2 }
    uGlow: { value: number }
    uFocus: { value: number }
    uPulseO: { value: THREE.Vector2 }
    uPulseR: { value: number }
    uPulseA: { value: number }
    uT: { value: number }
  }
  sram: { top: THREE.InstancedMesh; on: Float32Array; lit: THREE.Color; litBlue: THREE.Color; off: THREE.Color }
  systolic: { body: THREE.InstancedMesh; top: THREE.InstancedMesh; cols: number; rows: number; pos: Float32Array }
  coreCells: { mesh: THREE.InstancedMesh; on: Float32Array }
  leds: { mesh: THREE.Mesh; light?: THREE.PointLight; phase: number }[]
  coreLight: THREE.PointLight
  wafer: { mat: THREE.ShaderMaterial; halo: THREE.Sprite }
  dust: THREE.Points
  haze: THREE.Sprite[]
  key: THREE.DirectionalLight
}

const hdr = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace)

function canvasTex(c: HTMLCanvasElement, srgb: boolean, aniso: number) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = aniso
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  return t
}

/** map a horizontal surface onto the floorplan by its world position */
function planarUV(geo: THREE.BufferGeometry) {
  const pos = geo.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = dieU(pos.getX(i))
    uv[i * 2 + 1] = dieV(pos.getZ(i))
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
  return geo
}

function hPlane(x0: number, x1: number, z0: number, z1: number, y: number) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0)
  g.rotateX(-Math.PI / 2)
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2)
  return planarUV(g)
}

function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

/* the die's own surface: albedo and routing, with the cursor's light, the
   focused chapter and the send pulse all worked into the emissive term so
   they only ever light the metal, never the gaps between it */
function dieMaterial(fp: Floorplan, aniso: number, U: WorldState["uniforms"]) {
  const m = new THREE.MeshStandardMaterial({
    map: canvasTex(fp.albedo, true, aniso),
    emissiveMap: canvasTex(fp.emissive, true, aniso),
    emissive: 0xffffff,
    emissiveIntensity: 1,
    roughness: 0.38,
    metalness: 0.55,
  })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U)
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDieWorld;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvDieWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vDieWorld;
uniform vec2 uCursor; uniform float uGlow; uniform float uFocus;
uniform vec2 uPulseO; uniform float uPulseR; uniform float uPulseA; uniform float uT;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
  float dC = distance(vDieWorld.xz, uCursor);
  float glow = exp(-dC * dC / 22.0) * uGlow;
  float base = 0.2 + 0.2 * uFocus;
  totalEmissiveRadiance *= base + 3.4 * glow;
  float dP = abs(distance(vDieWorld.xz, uPulseO) - uPulseR);
  totalEmissiveRadiance += emissiveColor.rgb * exp(-dP * dP * 0.9) * uPulseA * vec3(1.2, 1.8, 4.0);`,
      )
  }
  return m
}

/* the stacked metal layers seen edge-on on the sides of the plateau and the
   core: dark bands with the occasional bright interface line */
function layerTexture() {
  const c = canvas2d(16, 512)
  const x = c.getContext("2d")!
  const rnd = mulberry32(7)
  let y = 0
  while (y < 512) {
    const h = 8 + Math.floor(rnd() * 40)
    const v = 9 + Math.floor(rnd() * 12)
    x.fillStyle = `rgb(${v},${v + 1},${v + 4})`
    x.fillRect(0, y, 16, h)
    if (rnd() < 0.5) {
      x.fillStyle = rnd() < 0.3 ? "rgba(122,167,255,0.7)" : "rgba(220,228,240,0.35)"
      x.fillRect(0, y, 16, 1)
    }
    y += h
  }
  return c
}

function edges(geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), mat)
}

export function buildEnvironment(renderer: THREE.WebGLRenderer) {
  /* a dark room with a few long light strips overhead and a cold panel low
     on the horizon: enough for the metal to catch thin streaks of light */
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x000000)
  const strip = new THREE.MeshBasicMaterial({ color: hdr(3.2, 3.4, 3.8), side: THREE.DoubleSide })
  for (let i = -2; i <= 2; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 30), strip)
    m.position.set(i * 4, 9, 0)
    m.rotation.x = Math.PI / 2
    env.add(m)
  }
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 6),
    new THREE.MeshBasicMaterial({ color: hdr(0.25, 0.45, 1.1), side: THREE.DoubleSide }),
  )
  panel.position.set(0, 1, -16)
  env.add(panel)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: hdr(2, 2.4, 3.6), side: THREE.DoubleSide }))
  disc.position.set(10, 8, -14)
  disc.lookAt(0, 0, 0)
  env.add(disc)
  const pm = new THREE.PMREMGenerator(renderer)
  const rt = pm.fromScene(env, 0.035)
  pm.dispose()
  env.traverse((o) => {
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
  })
  return rt
}

export function buildWorld(scene: THREE.Scene, fp: Floorplan, opts: { aniso: number; lite: boolean; shadows: boolean }) {
  const rnd = mulberry32(42)
  const U: WorldState["uniforms"] = {
    uCursor: { value: new THREE.Vector2(0, -1000) },
    uGlow: { value: 0 },
    uFocus: { value: 0 },
    uPulseO: { value: new THREE.Vector2(0, 0) },
    uPulseR: { value: 0 },
    uPulseA: { value: 0 },
    uT: { value: 0 },
  }
  const die = dieMaterial(fp, opts.aniso, U)

  const metalDark = new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.88, roughness: 0.3 })
  const metalMid = new THREE.MeshStandardMaterial({ color: 0x1a1e26, metalness: 0.9, roughness: 0.26 })
  const metalBright = new THREE.MeshStandardMaterial({ color: 0xa9b2c2, metalness: 1, roughness: 0.22 })
  const layerTex = canvasTex(layerTexture(), true, opts.aniso)
  layerTex.wrapS = layerTex.wrapT = THREE.RepeatWrapping
  const layered = new THREE.MeshStandardMaterial({
    map: layerTex,
    emissiveMap: layerTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.16,
    metalness: 0.7,
    roughness: 0.35,
  })
  const lineMat = new THREE.LineBasicMaterial({ color: 0xb4c3e0, transparent: true, opacity: 0.26 })
  const lineHot = new THREE.LineBasicMaterial({ color: 0x9fbbff, transparent: true, opacity: 0.55 })
  const hot = new THREE.MeshBasicMaterial({ color: hdr(2.0, 2.15, 2.5) })
  const hotBlue = new THREE.MeshBasicMaterial({ color: hdr(0.7, 1.25, 3.4) })

  const root = new THREE.Group()
  scene.add(root)

  /* ------------------------------------------------- package and die */
  const pkg = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x030407, metalness: 0.3, roughness: 0.85 }),
  )
  pkg.rotation.x = -Math.PI / 2
  pkg.position.y = -0.3
  pkg.receiveShadow = true
  root.add(pkg)

  const dieBody = new THREE.Mesh(boxAt(DIE_W, 0.3, DIE_D, (DIE.x0 + DIE.x1) / 2, -0.15, (DIE.z0 + DIE.z1) / 2), layered)
  root.add(dieBody)
  const surf = new THREE.Mesh(hPlane(DIE.x0, DIE.x1, DIE.z0, DIE.z1, 0.001), die)
  surf.receiveShadow = true
  root.add(surf)

  /* lead fingers on the package, fanning out from the front and sides */
  const leads: THREE.BufferGeometry[] = []
  for (let x = DIE.x0 + 3; x < DIE.x1 - 2; x += 2) leads.push(boxAt(0.7, 0.06, 3.4, x * 1.12, -0.27, DIE.z1 + 6.5))
  for (let z = DIE.z0 + 5; z < DIE.z1 - 2; z += 2.4) {
    leads.push(boxAt(3.4, 0.06, 0.7, DIE.x0 - 6.5, -0.27, z))
    leads.push(boxAt(3.4, 0.06, 0.7, DIE.x1 + 6.5, -0.27, z))
  }
  root.add(new THREE.Mesh(mergeGeometries(leads), metalMid))

  /* ------------------------------------------------- pads + bond wires */
  const pads: THREE.BufferGeometry[] = []
  const wires: THREE.BufferGeometry[] = []
  const wire = (a: THREE.Vector3, b: THREE.Vector3, lift: number) => {
    const mid = a.clone().lerp(b, 0.35)
    mid.y += lift
    const curve = new THREE.CatmullRomCurve3([a, mid, b.clone().setY(b.y + 0.05)], false, "centripetal")
    wires.push(new THREE.TubeGeometry(curve, opts.lite ? 14 : 24, 0.022, opts.lite ? 4 : 6, false))
  }
  for (let x = DIE.x0 + 3; x < DIE.x1 - 2; x += 2) {
    pads.push(boxAt(0.95, 0.06, 0.95, x, 0.03, DIE.z1 - 1.3))
    wire(new THREE.Vector3(x, 0.06, DIE.z1 - 1.3), new THREE.Vector3(x * 1.12, -0.24, DIE.z1 + 5.4), 0.8 + rnd() * 0.5)
  }
  for (let z = DIE.z0 + 5; z < DIE.z1 - 2; z += 2.4) {
    for (const side of [-1, 1]) {
      const ex = side < 0 ? DIE.x0 + 1.3 : DIE.x1 - 1.3
      pads.push(boxAt(0.95, 0.06, 0.95, ex, 0.03, z))
      wire(new THREE.Vector3(ex, 0.06, z), new THREE.Vector3(ex + side * 5.4, -0.24, z), 0.8 + rnd() * 0.5)
    }
  }
  root.add(new THREE.Mesh(mergeGeometries(pads), metalBright))
  /* the wires carry a faint light of their own so they read as fine bright
     filaments against the black rather than dark hoops */
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xc9d1de, metalness: 0.85, roughness: 0.3, emissive: 0x2a3446, emissiveIntensity: 1 })
  root.add(new THREE.Mesh(mergeGeometries(wires), wireMat))

  /* ------------------------------------------------- the metal stack */
  const steps: THREE.BufferGeometry[] = []
  const stepTops: THREE.BufferGeometry[] = []
  const nosings: THREE.BufferGeometry[] = []
  const nosingsBlue: THREE.BufferGeometry[] = []
  const dz = (STAIRS.zFront - STAIRS.zBack) / STAIRS.steps
  const dh = PODIUM.y / STAIRS.steps
  for (let i = 0; i < STAIRS.steps; i++) {
    const zf = STAIRS.zFront - i * dz
    const h = (i + 1) * dh
    steps.push(boxAt(STAIRS.w, h, dz, 0, h / 2, zf - dz / 2))
    stepTops.push(hPlane(-STAIRS.w / 2, STAIRS.w / 2, zf - dz, zf, h + 0.002))
    const strip = boxAt(STAIRS.w, 0.025, 0.05, 0, h + 0.01, zf - 0.03)
    ;(i % 4 === 3 ? nosingsBlue : nosings).push(strip)
  }
  const stairMesh = new THREE.Mesh(mergeGeometries(steps), layered)
  stairMesh.castShadow = stairMesh.receiveShadow = true
  root.add(stairMesh)
  root.add(new THREE.Mesh(mergeGeometries(stepTops), die))
  root.add(new THREE.Mesh(mergeGeometries(nosings), hot))
  root.add(new THREE.Mesh(mergeGeometries(nosingsBlue), hotBlue))
  /* rails up both sides of the flight */
  for (const s of [-1, 1]) {
    const a = new THREE.Vector3(s * (STAIRS.w / 2 + 0.35), 0.4, STAIRS.zFront)
    const b = new THREE.Vector3(s * (STAIRS.w / 2 + 0.35), PODIUM.y + 0.4, STAIRS.zBack)
    const len = a.distanceTo(b)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, len), hotBlue)
    rail.position.copy(a).lerp(b, 0.5)
    rail.lookAt(b)
    root.add(rail)
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, len), metalDark)
    cheek.position.copy(a).lerp(b, 0.5).add(new THREE.Vector3(0, -0.35, 0))
    cheek.lookAt(b.clone().add(new THREE.Vector3(0, -0.35, 0)))
    root.add(cheek)
  }

  /* ------------------------------------------------- the plateau */
  const podW = PODIUM.x1 - PODIUM.x0
  const podD = PODIUM.z1 - PODIUM.z0
  const podGeo = boxAt(podW, PODIUM.y, podD, 0, PODIUM.y / 2, (PODIUM.z0 + PODIUM.z1) / 2)
  const pod = new THREE.Mesh(podGeo, layered)
  pod.castShadow = pod.receiveShadow = true
  root.add(pod)
  const podTop = new THREE.Mesh(hPlane(PODIUM.x0, PODIUM.x1, PODIUM.z0, PODIUM.z1, PODIUM.y + 0.002), die)
  podTop.receiveShadow = true
  root.add(podTop)
  root.add(edges(podGeo, lineMat))

  /* ------------------------------------------------- the gate */
  const gy = PODIUM.y
  /* a row of gates wrapped over the fins: square frames, no overhang, so
     they read as a transistor array rather than a shrine gate */
  const gateParts: THREE.BufferGeometry[] = []
  const gateGlows: THREE.BufferGeometry[] = []
  for (const gz of GATE.zs) {
    gateParts.push(
      boxAt(0.7, GATE.height, 0.9, -GATE.span, gy + GATE.height / 2, gz),
      boxAt(0.7, GATE.height, 0.9, GATE.span, gy + GATE.height / 2, gz),
      boxAt(GATE.span * 2 + 0.7, 0.85, 0.9, 0, gy + GATE.height + 0.42, gz),
    )
    gateGlows.push(boxAt(GATE.span * 2 - 0.7, 0.03, 0.05, 0, gy + GATE.height - 0.02, gz + 0.46))
  }
  const gateGeo = mergeGeometries(gateParts)
  const gate = new THREE.Mesh(gateGeo, metalMid)
  gate.castShadow = true
  root.add(gate)
  root.add(edges(gateGeo, lineHot))
  root.add(new THREE.Mesh(mergeGeometries(gateGlows), hotBlue))

  /* fins running under the gate */
  const finGeos: THREE.BufferGeometry[] = []
  const finTops: THREE.BufferGeometry[] = []
  for (const x of FINS.xs) {
    finGeos.push(boxAt(FINS.w, FINS.h, FINS.z1 - FINS.z0, x, gy + FINS.h / 2, (FINS.z0 + FINS.z1) / 2))
    finTops.push(boxAt(FINS.w * 0.4, 0.02, FINS.z1 - FINS.z0, x, gy + FINS.h + 0.01, (FINS.z0 + FINS.z1) / 2))
  }
  const finGeo = mergeGeometries(finGeos)
  const fins = new THREE.Mesh(finGeo, metalMid)
  fins.castShadow = true
  root.add(fins)
  root.add(new THREE.Mesh(mergeGeometries(finTops), hotBlue))

  /* ------------------------------------------------- the core */
  const tiers = [
    { w: 22, h: 4.4, d: 12 },
    { w: 15.5, h: 3.2, d: 8.5 },
    { w: 9, h: 2.3, d: 5.2 },
  ]
  let y = gy
  const cellMats: THREE.Matrix4[] = []
  for (const [ti, t] of tiers.entries()) {
    const g = boxAt(t.w, t.h, t.d, 0, y + t.h / 2, CORE.z)
    const m = new THREE.Mesh(g, layered)
    m.castShadow = m.receiveShadow = true
    root.add(m)
    root.add(edges(g, lineMat))
    /* the cache cells on the front face: the lit windows of the hall */
    const rows = ti === 0 ? 3 : ti === 1 ? 2 : 1
    const cols = ti === 0 ? 18 : ti === 1 ? 12 : 6
    const cw = (t.w - 2) / cols
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const mx = new THREE.Matrix4().compose(
          new THREE.Vector3(-t.w / 2 + 1 + cw * (c + 0.5), y + t.h * 0.3 + r * ((t.h * 0.5) / Math.max(1, rows - 1 || 1)), CORE.z + t.d / 2 + 0.012),
          new THREE.Quaternion(),
          new THREE.Vector3(cw * 0.72, Math.min(0.42, t.h * 0.12), 1),
        )
        cellMats.push(mx)
      }
    y += t.h
  }
  const capGeo = boxAt(10.5, 0.22, 6.4, 0, y + 0.11, CORE.z)
  root.add(new THREE.Mesh(capGeo, metalBright))
  root.add(edges(capGeo, lineHot))
  const cells = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), cellMats.length)
  const cellOn = new Float32Array(cellMats.length)
  cellMats.forEach((mx, i) => {
    cells.setMatrixAt(i, mx)
    cellOn[i] = rnd() < 0.34 ? 1 : 0
    cells.setColorAt(i, cellOn[i] ? (rnd() < 0.18 ? hdr(0.5, 0.9, 2.4) : hdr(1.15, 1.2, 1.35)) : hdr(0.012, 0.014, 0.02))
  })
  root.add(cells)

  const coreLight = new THREE.PointLight(0xe2e8ff, 26, 22, 2)
  coreLight.position.set(0, gy + 3.2, CORE.z + 10)
  root.add(coreLight)

  /* ------------------------------------------------- memory banks */
  const cell = 1.15
  const sramTops: THREE.Matrix4[] = []
  const sramBodies: THREE.BufferGeometry[] = []
  for (const bank of [SRAM_L, SRAM_R]) {
    for (let x = bank.x0 + 0.7; x < bank.x1 - 0.4; x += cell)
      for (let z = bank.z0 + 0.7; z < bank.z1 - 0.4; z += cell) {
        sramBodies.push(boxAt(0.8, 0.22, 0.8, x, 0.11, z))
        sramTops.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.225, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), new THREE.Vector3(0.62, 0.62, 1)))
      }
  }
  const sramBody = new THREE.Mesh(mergeGeometries(sramBodies), metalMid)
  sramBody.receiveShadow = true
  root.add(sramBody)
  const sramTop = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), sramTops.length)
  const sramOn = new Float32Array(sramTops.length)
  const litW = hdr(1.3, 1.4, 1.7)
  const litB = hdr(0.5, 0.95, 2.6)
  const off = hdr(0.018, 0.02, 0.03)
  sramTops.forEach((mx, i) => {
    sramTop.setMatrixAt(i, mx)
    sramOn[i] = rnd() < 0.08 ? 1 : 0
    sramTop.setColorAt(i, sramOn[i] ? (rnd() < 0.4 ? litB : litW) : off)
  })
  root.add(sramTop)

  /* ------------------------------------------------- the array processor */
  const sCols = opts.lite ? 8 : 11
  const sRows = opts.lite ? 12 : 16
  const sx = (SYSTOLIC.x1 - SYSTOLIC.x0) / sCols
  const sz = (SYSTOLIC.z1 - SYSTOLIC.z0) / sRows
  const sysBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), metalMid, sCols * sRows)
  const sysTop = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    sCols * sRows,
  )
  const sysPos = new Float32Array(sCols * sRows * 2)
  for (let c = 0; c < sCols; c++)
    for (let r = 0; r < sRows; r++) {
      const i = c * sRows + r
      sysPos[i * 2] = SYSTOLIC.x0 + sx * (c + 0.5)
      sysPos[i * 2 + 1] = SYSTOLIC.z0 + sz * (r + 0.5)
    }
  root.add(sysBody, sysTop)

  /* ------------------------------------------------- heatsinks */
  const sinkGeos: THREE.BufferGeometry[] = []
  for (let x = HEATSINK.x0 + 0.6; x < HEATSINK.x1; x += 1.35)
    sinkGeos.push(boxAt(0.2, 4.6, HEATSINK.z1 - HEATSINK.z0 - 2, x, 2.3, (HEATSINK.z0 + HEATSINK.z1) / 2))
  sinkGeos.push(boxAt(HEATSINK.x1 - HEATSINK.x0, 0.3, HEATSINK.z1 - HEATSINK.z0, (HEATSINK.x0 + HEATSINK.x1) / 2, 0.15, (HEATSINK.z0 + HEATSINK.z1) / 2))
  const sink = new THREE.Mesh(mergeGeometries(sinkGeos), metalBright)
  sink.castShadow = true
  root.add(sink)
  /* a smaller fin block and a cluster of decoupling capacitors frame the
     approach, where the maples stood */
  const nearSink: THREE.BufferGeometry[] = []
  for (let x = 19; x < 28; x += 1.2) nearSink.push(boxAt(0.18, 2.6, 7, x, 1.3, 0.5))
  const ns = new THREE.Mesh(mergeGeometries(nearSink), metalBright)
  ns.castShadow = true
  root.add(ns)
  const caps: THREE.BufferGeometry[] = []
  const capRings: THREE.BufferGeometry[] = []
  for (let i = 0; i < 9; i++) {
    const cx = -27 + (i % 3) * 2.4 + rnd() * 0.5
    const cz = -1 + Math.floor(i / 3) * 2.4 + rnd() * 0.5
    const ch = 1.2 + rnd() * 1.4
    caps.push(new THREE.CylinderGeometry(0.75, 0.75, ch, 28).translate(cx, ch / 2, cz))
    capRings.push(new THREE.TorusGeometry(0.62, 0.025, 6, 32).rotateX(Math.PI / 2).translate(cx, ch + 0.01, cz))
  }
  const capMesh = new THREE.Mesh(mergeGeometries(caps), metalMid)
  capMesh.castShadow = true
  root.add(capMesh)
  root.add(new THREE.Mesh(mergeGeometries(capRings), hotBlue))

  /* ------------------------------------------------- test-point LEDs */
  const leds: WorldState["leds"] = []
  const ledGeo = new THREE.SphereGeometry(0.13, 16, 12)
  const ledSpots: [number, number, number, boolean][] = [
    [-5.4, 1.1, -11, true],
    [5.4, 1.1, -11, false],
    [-5.4, 2.6, -19, false],
    [5.4, 2.6, -19, true],
    [-12.5, PODIUM.y + 0.6, -26, true],
    [12.5, PODIUM.y + 0.6, -26, true],
    [-8, PODIUM.y + 0.6, -38, false],
    [8, PODIUM.y + 0.6, -38, false],
  ]
  ledSpots.forEach(([x, ly, z, withLight], i) => {
    const blue = i % 3 !== 1
    const m = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: blue ? hdr(1.2, 2.2, 6) : hdr(4, 4.2, 4.6) }))
    m.position.set(x, ly, z)
    root.add(m)
    let light: THREE.PointLight | undefined
    if (withLight && !opts.lite) {
      light = new THREE.PointLight(blue ? 0x7aa7ff : 0xe8eeff, 14, 10, 2)
      light.position.set(x, ly + 0.3, z)
      root.add(light)
    }
    leds.push({ mesh: m, light, phase: rnd() * Math.PI * 2 })
  })

  /* ------------------------------------------------- lights */
  scene.add(new THREE.HemisphereLight(0x1d2638, 0x000000, 0.32))
  const key = new THREE.DirectionalLight(0xe4ebff, 1.5)
  key.position.set(16, 30, -62)
  key.target.position.set(0, 2, -18)
  scene.add(key, key.target)
  if (opts.shadows) {
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    const c = key.shadow.camera
    c.left = -40
    c.right = 40
    c.top = 46
    c.bottom = -40
    c.near = 5
    c.far = 120
    key.shadow.bias = -0.0008
    key.shadow.normalBias = 0.04
    key.shadow.autoUpdate = false
    key.shadow.needsUpdate = true
  }
  const fill = new THREE.DirectionalLight(0xc6d0e4, 0.28)
  fill.position.set(-10, 14, 30)
  scene.add(fill)
  const stairLight = new THREE.PointLight(0xeef2ff, 9, 15, 2)
  stairLight.position.set(0, 5.5, -10)
  root.add(stairLight)

  /* ------------------------------------------------- the wafer */
  const waferMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uBright: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
varying vec2 vUv; uniform float uT; uniform float uBright;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float notch = 1.0 - smoothstep(0.045, 0.05, length(p - vec2(0.0, -1.0)));
  if (r > 1.0 || notch > 0.5) discard;
  /* the die grid, with the partial dies at the edge excluded */
  vec2 cell = floor(p * 15.0 + 0.5);
  vec2 f = fract(p * 15.0 + 0.5);
  float inGrid = step(length((cell + sign(cell) * 0.5) / 15.0), 0.95);
  float aa = fwidth(p.x * 15.0) * 1.2;
  float street = max(1.0 - smoothstep(0.045, 0.045 + aa, f.x), 1.0 - smoothstep(0.045, 0.045 + aa, f.y));
  /* thin-film colour shifting across the face */
  float ang = atan(p.y, p.x);
  float film = 0.5 + 0.5 * sin(r * 7.0 + ang * 1.6 + uT * 0.12);
  vec3 base = mix(vec3(0.016, 0.019, 0.03), vec3(0.06, 0.08, 0.16), film * 0.9);
  float sheen = exp(-pow((p.x * 0.72 + p.y * 0.69 - 0.18) * 2.2, 2.0));
  base += vec3(0.62, 0.72, 1.0) * sheen * (0.3 + 0.35 * film);
  base = mix(base, base * 0.5 + vec3(0.2, 0.24, 0.34) * 0.45, street * inGrid * 0.6);
  base *= mix(0.7, 1.0, inGrid);
  float rim = smoothstep(0.955, 1.0, r);
  base += vec3(0.9, 1.05, 1.6) * rim * 1.4;
  gl_FragColor = vec4(base * uBright, 1.0);
}`,
    fog: false,
  })
  const wafer = new THREE.Mesh(new THREE.CircleGeometry(WAFER.r, 160), waferMat)
  wafer.position.set(WAFER.x, WAFER.y, WAFER.z)
  wafer.lookAt(0, 6, 14)
  root.add(wafer)
  const haloTex = (() => {
    const c = canvas2d(256, 256)
    const x = c.getContext("2d")!
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.35, "rgba(255,255,255,0.35)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    return canvasTex(c, true, 1)
  })()
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: haloTex, color: hdr(0.07, 0.1, 0.22), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }),
  )
  halo.position.set(WAFER.x, WAFER.y, WAFER.z - 1)
  halo.scale.setScalar(WAFER.r * 4.4)
  root.add(halo)

  /* ------------------------------------------------- sky and air */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `varying vec3 vP;
void main(){ float h = normalize(vP).y;
  vec3 c = mix(vec3(0.004,0.006,0.012), vec3(0.0), smoothstep(-0.02, 0.35, h));
  c += vec3(0.008,0.013,0.03) * exp(-abs(h) * 22.0);
  gl_FragColor = vec4(c, 1.0); }`,
    }),
  )
  sky.renderOrder = -1
  root.add(sky)

  const hazeMat = new THREE.SpriteMaterial({ map: haloTex, color: hdr(0.02, 0.026, 0.05), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 })
  const haze: THREE.Sprite[] = []
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(hazeMat)
    s.position.set(-24 + i * 12, 4 + rnd() * 6, -30 - rnd() * 30)
    s.scale.set(34, 14, 1)
    s.userData = { x0: s.position.x, sp: 0.04 + rnd() * 0.05, ph: rnd() * 6 }
    root.add(s)
    haze.push(s)
  }

  const N = opts.lite ? 260 : 700
  const dpos = new Float32Array(N * 3)
  const dseed = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    dpos[i * 3] = -30 + rnd() * 60
    dpos[i * 3 + 1] = rnd() * 22
    dpos[i * 3 + 2] = -70 + rnd() * 88
    dseed[i] = rnd()
  }
  const dgeo = new THREE.BufferGeometry()
  dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3))
  dgeo.setAttribute("aSeed", new THREE.BufferAttribute(dseed, 1))
  const dust = new THREE.Points(
    dgeo,
    new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uPx: { value: 800 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSeed; uniform float uT; uniform float uPx; varying float vA;
void main(){ vec3 p = position;
  p.y = mod(p.y + uT * (0.12 + aSeed * 0.2), 22.0);
  p.x += sin(uT * 0.2 + aSeed * 20.0) * 0.8;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (0.018 + aSeed * 0.02) / -mv.z;
  vA = (0.35 + 0.65 * aSeed) * smoothstep(60.0, 8.0, -mv.z);
}`,
      fragmentShader: `varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)) * vA;
  gl_FragColor = vec4(vec3(0.75, 0.85, 1.0) * a, a); }`,
    }),
  )
  dust.frustumCulled = false
  root.add(dust)

  if (opts.shadows) {
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.material === die) m.receiveShadow = true
    })
  }

  const state: WorldState = {
    uniforms: U,
    sram: { top: sramTop, on: sramOn, lit: litW, litBlue: litB, off },
    systolic: { body: sysBody, top: sysTop, cols: sCols, rows: sRows, pos: sysPos },
    coreCells: { mesh: cells, on: cellOn },
    leds,
    coreLight,
    wafer: { mat: waferMat, halo },
    dust,
    haze,
    key,
  }
  return { root, state, cellSize: { sx, sz } }
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

export function updateWorld(
  W: WorldState,
  cellSize: { sx: number; sz: number },
  t: number,
  dt: number,
  focus: number,
  reduce: boolean,
) {
  const U = W.uniforms
  U.uT.value = t
  U.uFocus.value = focus

  /* the array processor computes in diagonal waves */
  const { body, top, cols, rows, pos } = W.systolic
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const i = c * rows + r
      const wave = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.7 - (c + r) * 0.42)
      const h = 0.35 + wave * (1.1 + focus * 0.5)
      _v.set(pos[i * 2], 0, pos[i * 2 + 1])
      _s.set(cellSize.sx * 0.74, h, cellSize.sz * 0.74)
      body.setMatrixAt(i, _m.compose(_v, _q.identity(), _s))
      _v.y = h + 0.01
      _s.set(cellSize.sx * 0.6, 1, cellSize.sz * 0.6)
      top.setMatrixAt(i, _m.compose(_v, _q, _s))
      const k = Math.pow(wave, 3)
      top.setColorAt(i, _c.setRGB(0.03 + k * 0.6, 0.04 + k * 1.1, 0.07 + k * 3.0, THREE.LinearSRGBColorSpace))
    }
  body.instanceMatrix.needsUpdate = true
  top.instanceMatrix.needsUpdate = true
  if (top.instanceColor) top.instanceColor.needsUpdate = true

  if (!reduce) {
    /* memory cells blink in and out as the banks are read */
    const S = W.sram
    const flips = Math.random() < dt * 30 ? 3 : 0
    for (let f = 0; f < flips; f++) {
      const i = Math.floor(Math.random() * S.on.length)
      S.on[i] = S.on[i] ? 0 : Math.random() < 0.6 ? 1 : 0
      S.top.setColorAt(i, S.on[i] ? (Math.random() < 0.4 ? S.litBlue : S.lit) : S.off)
    }
    if (flips && S.top.instanceColor) S.top.instanceColor.needsUpdate = true

    const C = W.coreCells
    if (Math.random() < dt * 4) {
      const i = Math.floor(Math.random() * C.on.length)
      C.on[i] = C.on[i] ? 0 : 1
      C.mesh.setColorAt(i, C.on[i] ? (Math.random() < 0.18 ? _c.setRGB(0.5, 0.9, 2.4, THREE.LinearSRGBColorSpace) : _c.setRGB(1.15, 1.2, 1.35, THREE.LinearSRGBColorSpace)) : _c.setRGB(0.012, 0.014, 0.02, THREE.LinearSRGBColorSpace))
      if (C.mesh.instanceColor) C.mesh.instanceColor.needsUpdate = true
    }
  }

  for (const L of W.leds) {
    const p = reduce ? 0.8 : 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.4 + L.phase), 2)
    L.mesh.scale.setScalar(0.85 + p * 0.3 + focus * 0.2)
    if (L.light) L.light.intensity = 14 * (0.5 + p) * (1 + focus * 0.6)
  }
  W.coreLight.intensity = 26 * (1 + focus * 0.6)

  W.wafer.mat.uniforms.uT.value = t
  W.wafer.halo.material.opacity = 0.85 + Math.sin(t * 0.3) * 0.1 + focus * 0.2
  ;(W.dust.material as THREE.ShaderMaterial).uniforms.uT.value = reduce ? 0 : t
  for (const h of W.haze) {
    const d = h.userData as { x0: number; sp: number; ph: number }
    h.position.x = d.x0 + Math.sin(t * d.sp + d.ph) * 6
  }
}
