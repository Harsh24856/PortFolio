import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { BOARD_D, BOARD_W, KEYS, LAYERS, LAYER_GAP, TOOL_KEYS, keyCenter, keyIndex, type Layer } from "./board"
import { CAP, buildCap } from "./keycap"
import { buildLegends, type Rect } from "./legends"
import { canvas2d, clamp, damp } from "./util"

/* The keyboard, built from nothing but code: a tray, a light diffuser, the
   switches on their plate and board, a top case and sixty-eight sculpted
   caps. Each layer sits in its own group so the assembly chapter can pull
   them apart. Everything solid is cut by a scan plane across the board's
   width: on one side the solid parts, on the other their blue wireframe,
   the switches and traces visible through the case. */

const hdr = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace)

/* heights in the assembled stack, in units, from the underside of the tray */
const Y = {
  trayTop: 0.55,
  floor: 0.17,
  diffuser: 0.55,
  diffuserH: 0.08,
  caseBase: 0.63,
  caseH: 0.36,
  pcb: 0.24,
  plate: 0.52,
  capBase: 0.78,
}
const ROW_TILT = [0.12, 0.06, 0, -0.06, -0.07]
const ROW_LIFT = [0.05, 0.02, 0, 0.005, 0.01]
const TRAVEL = 0.16

export type ScanUniforms = {
  uScan: { value: number }
  uScanCol: { value: THREE.Color }
  uLine: { value: number }
}

/* ------------------------------------------------------------ the cut */

function scanPatch(mat: THREE.Material, S: ScanUniforms, key: string, extra?: (shader: THREE.WebGLProgramParametersWithUniforms) => void) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uScan = S.uScan
    sh.uniforms.uScanCol = S.uScanCol
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vWX;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 kbW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        kbW = instanceMatrix * kbW;
        #endif
        vWX = (modelMatrix * kbW).x;`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uScan; uniform vec3 uScanCol; varying float vWX;")
      .replace("void main() {", "void main() {\n  if (vWX < uScan) discard;")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n  totalEmissiveRadiance += uScanCol * (exp(-(vWX - uScan) * 34.0) * 2.2);",
      )
    extra?.(sh)
  }
  mat.customProgramCacheKey = () => `kb-${key}`
}

const LINE_VS = `
uniform float uScan;
varying float vWX; varying float vD;
#ifdef INST
attribute mat4 aM;
#endif
void main(){
  vec4 p = vec4(position, 1.0);
  #ifdef INST
  p = aM * p;
  #endif
  vec4 w = modelMatrix * p;
  vWX = w.x;
  vec4 mv = viewMatrix * w;
  vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`
const LINE_FS = `
uniform float uScan; uniform vec3 uScanCol; uniform float uLine;
varying float vWX; varying float vD;
void main(){
  float d = uScan - vWX;
  if (d < 0.0) discard;
  /* brightest at the cut, settling to a steady drawing behind it */
  float a = (0.22 + 0.7 * exp(-d * 3.0)) * uLine;
  gl_FragColor = vec4(uScanCol * a, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

function lineMat(S: ScanUniforms, inst: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: { uScan: S.uScan, uScanCol: S.uScanCol, uLine: S.uLine },
    vertexShader: LINE_VS,
    fragmentShader: LINE_FS,
    defines: inst ? { INST: 1 } : {},
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/* --------------------------------------------------------- the shapes */

function roundRect(w: number, d: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -d / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + d - r)
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + d)
  s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}
function holePath(w: number, d: number, r: number) {
  const s = roundRect(w, d, r)
  const p = new THREE.Path()
  p.setFromPoints(s.getPoints(8).reverse())
  return p
}

/** an extruded slab lying flat, bottom at y = 0, height h including any chamfer */
function slab(shape: THREE.Shape, h: number, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 8,
  })
  g.rotateX(-Math.PI / 2)
  g.translate(0, bevel, 0)
  return g
}

function edgeLines(geo: THREE.BufferGeometry, S: ScanUniforms, angle = 30) {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), lineMat(S, false))
  l.frustumCulled = false
  l.renderOrder = 2
  return l
}

/* the anodised case: dark, with every chamfer cut back to bright metal */
function caseMaterial(S: ScanUniforms, color: number) {
  const m = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.46 })
  scanPatch(m, S, `case`, (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvObjN = objectNormal;")
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjN;")
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        float ay = abs(normalize(vObjN).y);
        float chamfer = smoothstep(0.3, 0.45, ay) * (1.0 - smoothstep(0.88, 0.95, ay));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.8, 0.84), chamfer);
        metalnessFactor = mix(metalnessFactor, 1.0, chamfer);
        roughnessFactor = mix(roughnessFactor, 0.14, chamfer);`,
      )
  })
  return m
}

function pcbTexture() {
  const W = 2048
  const H = 640
  const c = canvas2d(W, H)
  const x = c.getContext("2d")!
  x.fillStyle = "#070b14"
  x.fillRect(0, 0, W, H)
  const px = W / BOARD_W
  x.lineCap = "round"
  /* traces run from each switch's pads in Manhattan steps toward the
     controller under the space bar */
  const mcu = { x: W * 0.43, y: H * 0.86 }
  KEYS.forEach((k, i) => {
    const c0 = keyCenter(k)
    const cx = (c0.x + BOARD_W / 2) * px
    const cy = (c0.z + BOARD_D / 2) * (H / BOARD_D)
    x.strokeStyle = i % 3 === 0 ? "rgba(90,130,230,0.55)" : "rgba(70,100,180,0.38)"
    x.lineWidth = 3
    x.beginPath()
    x.moveTo(cx + 14, cy + 18)
    const midY = cy + 34 + (i % 4) * 5
    x.lineTo(cx + 14, midY)
    x.lineTo(mcu.x + ((i % 9) - 4) * 9, midY)
    x.lineTo(mcu.x + ((i % 9) - 4) * 9, mcu.y)
    x.stroke()
    x.fillStyle = "#9aa3b5"
    x.beginPath()
    x.arc(cx - 20, cy - 8, 6, 0, Math.PI * 2)
    x.arc(cx + 14, cy + 18, 6, 0, Math.PI * 2)
    x.fill()
  })
  x.fillStyle = "#11151d"
  x.fillRect(mcu.x - 50, mcu.y - 20, 100, 60)
  x.strokeStyle = "#9aa3b5"
  x.lineWidth = 2
  x.strokeRect(mcu.x - 50, mcu.y - 20, 100, 60)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function switchGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const tint = (g: THREE.BufferGeometry, c: THREE.Color) => {
    const n = g.attributes.position.count
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) c.toArray(a, i * 3)
    g.setAttribute("color", new THREE.BufferAttribute(a, 3))
    return g
  }
  const housing = new THREE.Color(0x24272d)
  const top = new THREE.Color(0x3a3e46)
  const stem = new THREE.Color(0x3a64ff)
  parts.push(tint(new THREE.BoxGeometry(0.56, Y.plate - Y.pcb - 0.06, 0.56).translate(0, (Y.plate + Y.pcb + 0.06) / 2, 0), housing))
  parts.push(tint(new THREE.BoxGeometry(0.6, 0.18, 0.6).translate(0, Y.plate + 0.06 + 0.09, 0), top))
  parts.push(tint(new THREE.BoxGeometry(0.17, 0.12, 0.05).translate(0, Y.plate + 0.24 + 0.06, 0), stem))
  parts.push(tint(new THREE.BoxGeometry(0.05, 0.12, 0.17).translate(0, Y.plate + 0.24 + 0.06, 0), stem))
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))
  parts.forEach((p) => p.dispose())
  return g
}

/* ----------------------------------------------------------- the caps */

type Batch = {
  mesh: THREE.InstancedMesh
  keys: number[]
  state: THREE.InstancedBufferAttribute
}

export type Keyboard = ReturnType<typeof buildKeyboard>

export async function buildKeyboard(
  scene: THREE.Scene,
  opts: { aniso: number; shadows: boolean; family: string; toolNames: string[][] },
  step: () => Promise<void>,
) {
  const S: ScanUniforms = {
    uScan: { value: 12 },
    uScanCol: { value: hdr(0.35, 0.6, 2.2) },
    uLine: { value: 1 },
  }
  const root = new THREE.Group()
  root.rotation.x = 0.09
  scene.add(root)
  const layers = {} as Record<Layer, THREE.Group>
  for (const l of LAYERS) {
    const g = new THREE.Group()
    g.name = l
    root.add(g)
    layers[l] = g
  }
  const cast = (o: THREE.Mesh) => {
    o.castShadow = opts.shadows
    o.receiveShadow = opts.shadows
    return o
  }

  /* -------- tray and feet */
  const OW = BOARD_W + 0.9
  const OD = BOARD_D + 0.9
  const caseMat = caseMaterial(S, 0x232428)
  const trayShape = roundRect(OW - 0.1, OD - 0.1, 0.34)
  trayShape.holes.push(holePath(BOARD_W + 0.2, BOARD_D + 0.2, 0.16))
  const trayG = slab(trayShape, Y.trayTop, 0.05)
  const tray = cast(new THREE.Mesh(trayG, caseMat))
  const floorG = slab(roundRect(BOARD_W + 0.3, BOARD_D + 0.3, 0.2), Y.floor)
  const floor = cast(new THREE.Mesh(floorG, caseMat))
  const feetMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.9 })
  scanPatch(feetMat, S, "feet")
  const footG = slab(roundRect(2.4, 0.5, 0.2), 0.06)
  for (const [fx, fz] of [
    [-6, -2.2],
    [6, -2.2],
    [-6, 2.2],
    [6, 2.2],
  ]) {
    const f = new THREE.Mesh(footG, feetMat)
    f.position.set(fx, -0.06, fz)
    layers.tray.add(f)
  }
  layers.tray.add(tray, floor, edgeLines(trayG, S), edgeLines(floorG, S))
  await step()

  /* -------- diffuser: a frosted ring that carries the underglow */
  const difShape = roundRect(OW - 0.22, OD - 0.22, 0.3)
  difShape.holes.push(holePath(BOARD_W + 0.1, BOARD_D + 0.1, 0.14))
  const difG = slab(difShape, Y.diffuserH)
  const difMat = new THREE.MeshStandardMaterial({
    color: 0x0b1226,
    emissive: hdr(0.16, 0.32, 1.25),
    emissiveIntensity: 1,
    roughness: 0.6,
  })
  scanPatch(difMat, S, "diffuser")
  const dif = new THREE.Mesh(difG, difMat)
  dif.position.y = Y.diffuser
  const difL = edgeLines(difG, S)
  difL.position.y = Y.diffuser
  layers.diffuser.add(dif, difL)

  /* a pool of blue light under the board, spilling onto the backdrop */
  const glowTex = (() => {
    const c = canvas2d(256, 256)
    const x = c.getContext("2d")!
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.3, "rgba(255,255,255,0.4)")
    g.addColorStop(0.7, "rgba(255,255,255,0.08)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  })()
  const underMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: hdr(0.02, 0.05, 0.22),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const under = new THREE.Mesh(new THREE.PlaneGeometry(OW * 1.75, OD * 2.6), underMat)
  under.rotation.x = -Math.PI / 2
  under.position.y = -0.12
  under.renderOrder = 1
  root.add(under)
  await step()

  /* -------- switches, plate and the board under them */
  const internals = layers.switches
  const pcbG = new THREE.BoxGeometry(BOARD_W, 0.06, BOARD_D)
  pcbG.translate(0, Y.pcb + 0.03, 0)
  const pcbMat = new THREE.MeshStandardMaterial({ map: pcbTexture(), roughness: 0.55, metalness: 0.2 })
  pcbMat.map!.anisotropy = opts.aniso
  scanPatch(pcbMat, S, "pcb")
  const pcb = cast(new THREE.Mesh(pcbG, pcbMat))
  const plateShape = roundRect(BOARD_W + 0.02, BOARD_D + 0.02, 0.06)
  for (const k of KEYS) {
    const c = keyCenter(k)
    const h = new THREE.Path()
    const s = 0.28
    h.moveTo(c.x - s, -c.z - s)
    h.lineTo(c.x - s, -c.z + s)
    h.lineTo(c.x + s, -c.z + s)
    h.lineTo(c.x + s, -c.z - s)
    h.closePath()
    plateShape.holes.push(h)
  }
  const plateG = slab(plateShape, 0.06)
  plateG.translate(0, Y.plate, 0)
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x8b9099, metalness: 0.9, roughness: 0.32 })
  scanPatch(plateMat, S, "plate")
  const plate = cast(new THREE.Mesh(plateG, plateMat))
  const swG = switchGeometry()
  const swMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 })
  scanPatch(swMat, S, "switch")
  const sw = new THREE.InstancedMesh(swG, swMat, KEYS.length)
  const m4 = new THREE.Matrix4()
  KEYS.forEach((k, i) => {
    const c = keyCenter(k)
    sw.setMatrixAt(i, m4.makeTranslation(c.x, 0, c.z))
  })
  sw.castShadow = opts.shadows
  const swEdges = new THREE.EdgesGeometry(swG, 30)
  const swLineG = new THREE.InstancedBufferGeometry()
  swLineG.setAttribute("position", swEdges.attributes.position)
  swLineG.setAttribute("aM", sw.instanceMatrix)
  swLineG.instanceCount = KEYS.length
  const swLines = new THREE.LineSegments(swLineG, lineMat(S, true))
  swLines.frustumCulled = false
  swLines.renderOrder = 2
  internals.add(pcb, plate, sw, swLines, edgeLines(plateG, S, 40), edgeLines(pcbG, S))
  await step()

  /* -------- top case */
  const caseShape = roundRect(OW - 0.1, OD - 0.1, 0.34)
  caseShape.holes.push(holePath(BOARD_W + 0.12, BOARD_D + 0.12, 0.12))
  const caseG = slab(caseShape, Y.caseH, 0.06)
  const top = cast(new THREE.Mesh(caseG, caseMat))
  top.position.y = Y.caseBase
  const topL = edgeLines(caseG, S)
  topL.position.y = Y.caseBase
  layers.case.add(top, topL)
  await step()

  /* -------- caps */
  const fonts = `500 40px ${opts.family}`
  try {
    await document.fonts.load(fonts, "AaBb")
    await document.fonts.load(`600 40px ${opts.family}`, "AaBb")
  } catch {
    /* fallback face */
  }
  const leg = buildLegends(opts.family, opts.toolNames)
  const legendTex = new THREE.CanvasTexture(leg.canvas)
  legendTex.colorSpace = THREE.SRGBColorSpace
  legendTex.premultiplyAlpha = true
  legendTex.anisotropy = opts.aniso
  await step()

  const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0 })
  const litCol = { value: new THREE.Color(0x2f5bff) }
  scanPatch(capMat, S, "cap", (sh) => {
    sh.uniforms.tLegend = { value: legendTex }
    sh.uniforms.uLitCol = litCol
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec4 aRA; attribute vec4 aRB; attribute vec4 aSt;\nvarying vec4 vRA; varying vec4 vRB; varying vec4 vSt; varying vec2 vUvK;",
      )
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvRA = aRA; vRB = aRB; vSt = aSt; vUvK = uv;")
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D tLegend; uniform vec3 uLitCol;\nvarying vec4 vRA; varying vec4 vRB; varying vec4 vSt; varying vec2 vUvK;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec2 kuv = vUvK;
        float inCell = step(0.0, kuv.x) * step(kuv.x, 1.0) * step(0.0, kuv.y) * step(kuv.y, 1.0);
        vec2 ta = vec2(vRA.x + kuv.x * vRA.z, 1.0 - (vRA.y + (1.0 - kuv.y) * vRA.w));
        vec2 tb = vec2(vRB.x + kuv.x * vRB.z, 1.0 - (vRB.y + (1.0 - kuv.y) * vRB.w));
        vec4 lg = mix(texture2D(tLegend, ta), texture2D(tLegend, tb), vSt.x) * inCell;
        vec3 capCol = mix(diffuseColor.rgb, uLitCol, vSt.y) * (1.0 + vSt.w * 0.08);
        diffuseColor.rgb = capCol * (1.0 - lg.a) + lg.rgb;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uLitCol * (vSt.y * 0.22) + vec3(1.0) * lg.a * vSt.x * 0.9 + vec3(0.25, 0.45, 1.6) * vSt.z;`,
      )
  })

  const COL = {
    alpha: new THREE.Color(0xdcd9d2),
    mod: new THREE.Color(0x35373c),
    accent: new THREE.Color(0x3159e8),
  }
  const caps = layers.caps
  const byWidth = new Map<number, number[]>()
  KEYS.forEach((k, i) => byWidth.set(k.w, [...(byWidth.get(k.w) ?? []), i]))
  const batches: Batch[] = []
  const slot = new Int32Array(KEYS.length * 2)
  const capLineMat = lineMat(S, true)
  for (const [w, keys] of byWidth) {
    const g = buildCap(w)
    const n = keys.length
    const aRA = new Float32Array(n * 4)
    const aRB = new Float32Array(n * 4)
    keys.forEach((ki, j) => {
      aRA.set(leg.rectsA[ki] as Rect, j * 4)
      aRB.set(leg.rectsB[ki] as Rect, j * 4)
    })
    g.setAttribute("aRA", new THREE.InstancedBufferAttribute(aRA, 4))
    g.setAttribute("aRB", new THREE.InstancedBufferAttribute(aRB, 4))
    const state = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4)
    state.setUsage(THREE.DynamicDrawUsage)
    g.setAttribute("aSt", state)
    const mesh = new THREE.InstancedMesh(g, capMat, n)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.castShadow = opts.shadows
    mesh.receiveShadow = opts.shadows
    mesh.frustumCulled = false
    keys.forEach((ki, j) => {
      mesh.setColorAt(j, COL[KEYS[ki].kind])
      slot[ki * 2] = batches.length
      slot[ki * 2 + 1] = j
    })
    const lg = new THREE.InstancedBufferGeometry()
    lg.setAttribute("position", new THREE.EdgesGeometry(g, 20).attributes.position)
    lg.setAttribute("aM", mesh.instanceMatrix)
    lg.instanceCount = n
    const lines = new THREE.LineSegments(lg, capLineMat)
    lines.frustumCulled = false
    lines.renderOrder = 2
    caps.add(mesh, lines)
    batches.push({ mesh, keys, state })
  }
  await step()

  /* -------- the scan plane: a sheet of light standing at the cut */
  const sheetMat = new THREE.ShaderMaterial({
    uniforms: { uCol: S.uScanCol, uA: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader:
      "uniform vec3 uCol; uniform float uA; varying vec2 vUv;\n" +
      "void main(){ float e = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);\n" +
      " float h = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);\n" +
      " gl_FragColor = vec4(uCol * e * h * 0.09 * uA, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(OD + 0.6, 1), sheetMat)
  sheet.rotation.y = Math.PI / 2
  sheet.renderOrder = 3
  root.add(sheet)

  /* ------------------------------------------------------ live state */
  const N = KEYS.length
  const y = new Float32Array(N)
  const v = new Float32Array(N)
  const held = new Float32Array(N)
  const flash = new Float32Array(N)
  const lit = new Float32Array(N)
  const hoverA = new Float32Array(N)
  const groupOf = new Int8Array(N).fill(-1)
  TOOL_KEYS.forEach((codes, g) =>
    codes.forEach((c) => {
      const i = keyIndex.get(c)
      if (i !== undefined && leg.toolOf.has(i)) groupOf[i] = g
    }),
  )
  let hovered = -1
  let explode = 0
  const lift = new Float32Array(LAYERS.length)
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const pos = new THREE.Vector3()
  const one = new THREE.Vector3(1, 1, 1)

  const writeKey = (i: number) => {
    const k = KEYS[i]
    const c = keyCenter(k)
    e.set(ROW_TILT[k.row], 0, 0)
    q.setFromEuler(e)
    pos.set(c.x, Y.capBase + ROW_LIFT[k.row] + y[i], c.z)
    m4.compose(pos, q, one)
    const b = batches[slot[i * 2]]
    b.mesh.setMatrixAt(slot[i * 2 + 1], m4)
  }
  for (let i = 0; i < N; i++) writeKey(i)
  batches.forEach((b) => (b.mesh.instanceMatrix.needsUpdate = true))

  const press = (i: number, hold = 0.09) => {
    if (i < 0 || i >= N) return
    held[i] = Math.max(held[i], hold)
    flash[i] = 1
  }

  /* where the pointer meets a cap, found against each cap's top face
     rather than its triangles: sixty-eight rectangle tests, not fifty
     thousand triangles */
  const inv = new THREE.Matrix4()
  const lr = new THREE.Ray()
  const pickKey = (ray: THREE.Ray) => {
    caps.updateMatrixWorld()
    inv.copy(caps.matrixWorld).invert()
    lr.copy(ray).applyMatrix4(inv)
    let best = -1
    let bestT = Infinity
    for (let i = 0; i < N; i++) {
      const k = KEYS[i]
      const c = keyCenter(k)
      const top = Y.capBase + ROW_LIFT[k.row] + y[i] + CAP.height
      if (Math.abs(lr.direction.y) < 1e-5) continue
      const t = (top - lr.origin.y) / lr.direction.y
      if (t <= 0 || t >= bestT) continue
      const hx = lr.origin.x + lr.direction.x * t - c.x
      const hz = lr.origin.z + lr.direction.z * t - c.z
      if (Math.abs(hx) < k.w / 2 - 0.04 && Math.abs(hz) < 0.46) {
        best = i
        bestT = t
      }
    }
    return best
  }

  type Frame = {
    dt: number
    explode: number
    scan: number
    lineAlpha: number
    group: number
    groupWeight: number
    ambient: number
    still: boolean
  }

  const update = (f: Frame) => {
    const dt = Math.min(f.dt, 1 / 30)
    explode = damp(explode, f.explode, 6, f.dt)
    /* the board opens one gap at a time from the top: the caps lift off
       first, then the case, then the switches, then the diffuser, so each
       step of the scroll opens it a little further */
    const G = LAYERS.length - 1
    let acc = 0
    lift[0] = 0
    layers[LAYERS[0]].position.y = 0
    for (let l = 1; l < LAYERS.length; l++) {
      const g = clamp(explode * G - (G - l), 0, 1)
      acc += LAYER_GAP * g * g * (3 - 2 * g)
      lift[l] = acc
      layers[LAYERS[l]].position.y = lift[l]
    }
    /* breathing light in the diffuser */
    difMat.emissiveIntensity = 1 + (f.still ? 0 : Math.sin(f.ambient * 1.3) * 0.12) + explode * 0.35
    root.position.y = f.still ? 0 : Math.sin(f.ambient * 0.55) * 0.05

    S.uScan.value = f.scan
    S.uLine.value = f.lineAlpha
    sheet.position.set(f.scan, lift[LAYERS.length - 1] * 0.5 + 0.45, 0)
    sheet.scale.y = 2.2 + lift[LAYERS.length - 1]
    sheetMat.uniforms.uA.value = clamp((BOARD_W / 2 + 0.6 - Math.abs(f.scan)) * 1.5, 0, 1) * f.lineAlpha

    let moved = false
    for (let i = 0; i < N; i++) {
      const targetLit = groupOf[i] === f.group && f.group >= 0 ? f.groupWeight : 0
      lit[i] = damp(lit[i], targetLit, 6, f.dt)
      hoverA[i] = damp(hoverA[i], i === hovered ? 1 : 0, 12, f.dt)
      flash[i] = Math.max(0, flash[i] - f.dt * 2.6)
      if (held[i] > 0) held[i] -= f.dt
      const target = (held[i] > 0 ? -TRAVEL : 0) + hoverA[i] * 0.045
      const acc = 520 * (target - y[i]) - 26 * v[i]
      v[i] += acc * dt
      y[i] += v[i] * dt
      if (Math.abs(v[i]) > 1e-4 || Math.abs(target - y[i]) > 1e-4) {
        writeKey(i)
        moved = true
      }
      const b = batches[slot[i * 2]]
      const j = slot[i * 2 + 1]
      b.state.setXYZW(j, lit[i], lit[i], flash[i], hoverA[i])
    }
    for (const b of batches) {
      b.state.needsUpdate = true
      if (moved) b.mesh.instanceMatrix.needsUpdate = true
    }
  }

  const stackMM = () => explode * LAYER_GAP

  return {
    root,
    layers,
    scan: S,
    update,
    press,
    pickKey,
    setHover: (i: number) => (hovered = i),
    stackGap: stackMM,
    legendTex,
    /** world-space centre of the board, for the backdrop's light pool */
    centre: () => root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.6 + lift[LAYERS.length - 1] * 0.5, 0)),
  }
}

/* A studio for the metal to reflect: a broad soft box overhead, two long
   strips either side for the chamfers to catch, and a low blue panel behind
   that leaves a cold line along the far edges. */
export function buildEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x000000)
  const panel = (w: number, h: number, col: THREE.Color, p: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }))
    m.position.set(...p)
    m.lookAt(0, 0, 0)
    env.add(m)
  }
  panel(14, 8, hdr(2.4, 2.5, 2.7), [0, 12, 2])
  panel(2, 18, hdr(3.2, 3.3, 3.5), [-13, 5, 4])
  panel(2, 18, hdr(1.8, 1.9, 2.1), [13, 5, 4])
  panel(30, 3, hdr(0.18, 0.35, 1.2), [0, 1.5, -14])
  const pm = new THREE.PMREMGenerator(renderer)
  const rt = pm.fromScene(env, 0.04)
  pm.dispose()
  env.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    if (m.material) (m.material as THREE.Material).dispose()
  })
  return rt
}
