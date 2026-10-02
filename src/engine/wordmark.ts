import * as THREE from "three"
import { canvas2d, clamp, easeOut, smooth } from "./util"
import { WORD_Z } from "./layout"

/* The giant wordmark from the template, kept: five glyph planes set to the
   frame width, standing on the die just past its front edge. What changed is
   how it arrives. Instead of rising out of the grass, each letter is
   deposited from the base up, the way a layer is exposed, with a thin bright
   edge marking the front of the deposition. It still dissolves as the
   camera closes on it. */

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const FRAG = `
uniform sampler2D map; uniform float uReveal; uniform float uOpacity; uniform float uT;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(map, vUv);
  float front = uReveal * 1.08 - 0.04;
  float shown = 1.0 - smoothstep(front - 0.004, front + 0.004, vUv.y);
  float edge = exp(-pow((vUv.y - front) * 70.0, 2.0)) * step(uReveal, 0.999);
  /* faint exposure lines just behind the front while it is moving */
  float lines = (0.5 + 0.5 * sin(vUv.y * 900.0)) * smoothstep(0.12, 0.0, front - vUv.y) * step(uReveal, 0.999);
  vec3 col = t.rgb * (1.0 + lines * 0.35) + vec3(0.6, 0.85, 1.8) * edge * 2.4;
  float a = t.a * max(shown, edge * 0.9) * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}`

export type Wordmark = {
  group: THREE.Group
  glyphs: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[]
  ink: { cx: number; w: number; asc: number }
}

export async function buildWordmark(scene: THREE.Scene, family: string, aniso: number): Promise<Wordmark> {
  const SZ = 320
  const TRACK = 0.06
  const PAD = 24
  const font = `800 ${SZ}px ${family}`
  try {
    await document.fonts.load(font, "HARSH")
  } catch {
    /* the fallback face is fine */
  }
  const m = canvas2d(4, 4).getContext("2d")!
  const setFont = (x: CanvasRenderingContext2D) => {
    x.font = font
    /* the variable width axis, where the browser exposes it to canvas */
    if ("fontStretch" in x) (x as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded"
    x.textBaseline = "alphabetic"
    x.textAlign = "left"
  }
  setFont(m)
  const word = "HARSH"
  type G = { ch: string; adv: number; asc: number; desc: number; l: number; r: number; pen: number }
  const gl: G[] = []
  let pen = 0
  let ascMax = 0
  let descMax = 0
  let xMin = 1e9
  let xMax = -1e9
  for (const ch of word) {
    const t = m.measureText(ch)
    const g = { ch, adv: t.width, asc: t.actualBoundingBoxAscent, desc: t.actualBoundingBoxDescent, l: t.actualBoundingBoxLeft, r: t.actualBoundingBoxRight, pen }
    gl.push(g)
    ascMax = Math.max(ascMax, g.asc)
    descMax = Math.max(descMax, g.desc)
    xMin = Math.min(xMin, pen - g.l)
    xMax = Math.max(xMax, pen + g.r)
    pen += t.width + TRACK * SZ
  }
  const group = new THREE.Group()
  const glyphs: Wordmark["glyphs"] = []
  for (const g of gl) {
    const cw = Math.ceil(g.l + g.r) + PAD * 2
    const chh = Math.ceil(g.asc + g.desc) + PAD * 2
    const c = canvas2d(cw, chh)
    const x = c.getContext("2d")!
    setFont(x)
    const grad = x.createLinearGradient(0, PAD + g.asc - ascMax, 0, PAD + g.asc + descMax * 0.4)
    grad.addColorStop(0, "rgb(246,247,250)")
    grad.addColorStop(0.55, "rgb(214,220,232)")
    grad.addColorStop(1, "rgb(150,160,180)")
    x.fillStyle = grad
    x.fillText(g.ch, PAD + g.l, PAD + g.asc)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = aniso
    tex.premultiplyAlpha = false
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uReveal: { value: 0 }, uOpacity: { value: 1 }, uT: { value: 0 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cw, chh), mat)
    mesh.position.set(g.pen + (g.r - g.l) / 2, (g.asc - g.desc) / 2, 0)
    mesh.renderOrder = 12
    mesh.frustumCulled = false
    group.add(mesh)
    glyphs.push(mesh)
  }
  group.position.z = WORD_Z
  scene.add(group)
  return { group, glyphs, ink: { cx: (xMin + xMax) / 2, w: xMax - xMin, asc: ascMax } }
}

/** reveal: 0 → 1 across the whole word; prog: camera progress along the walk */
export function updateWordmark(W: Wordmark, reveal: number, prog: number, t: number) {
  const near = smooth(0.04, 0.92, prog)
  W.glyphs.forEach((g, i) => {
    const st = clamp((reveal - i * 0.09) / 0.62, 0, 1)
    g.material.uniforms.uReveal.value = easeOut(st)
    g.material.uniforms.uOpacity.value = 1 - near * 0.97
    g.material.uniforms.uT.value = t
    g.visible = g.material.uniforms.uOpacity.value > 0.004 && st > 0
  })
}
