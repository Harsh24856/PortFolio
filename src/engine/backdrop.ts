import * as THREE from "three"
import { canvas2d } from "./util"

/* Everything behind the board, drawn in one full-screen pass before it: a
   dark field of hexagonal tiles, a pool of blue where the board's light
   falls, and the chapter's word standing huge behind it in brushed metal.
   Each word is printed twice into one atlas, crisp in the red channel and
   blurred in the green; the blur is read as a height field, so the letters
   get bevelled edges that catch a light which follows the pointer. */

export const WORDS = ["HARSH", "ABOUT", "TOOLKIT", "WORK", "SHEETS", "CONTACT", "SEHRA"] as const
const ROW = 292
const ATLAS_W = 2048

const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }"

const FS = `
uniform sampler2D tWords;
uniform vec2 uRes;
uniform vec2 uPar;
uniform vec3 uPool;
uniform vec4 uWordA;
uniform vec4 uWordB;
uniform vec2 uLight;
uniform float uT, uReveal, uFade;
uniform float uInk[7];
varying vec2 vUv;

float hexDist(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
vec4 hexCell(vec2 uv){
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return vec4(gv, uv - gv);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

/* x: row in the atlas, y: centre height of the word on screen (0 bottom),
   z: width as a share of the screen, w: opacity */
float inkOf(float row){
  float r = 0.0;
  for (int i = 0; i < 7; i++) if (abs(float(i) - row) < 0.5) r = uInk[i];
  return r;
}
vec2 wordUv(vec4 W, vec2 uv, float aspect){
  /* W.z is the share of the screen the ink spans, not the whole row */
  float full = W.z / max(inkOf(W.x), 0.05);
  float h = full * (${ROW.toFixed(1)} / ${ATLAS_W.toFixed(1)}) * aspect;
  return vec2((uv.x - 0.5) / full + 0.5, (uv.y - W.y) / h + 0.5);
}
float sampleH(float row, vec2 w, float ch){
  if (w.x < 0.0 || w.x > 1.0 || w.y < 0.0 || w.y > 1.0) return 0.0;
  vec2 t = vec2(w.x, (row + 1.0 - w.y) * ${(ROW / ATLAS_W).toFixed(6)});
  vec4 s = texture2D(tWords, t);
  return ch < 0.5 ? s.r : s.g;
}
vec4 word(vec4 W, vec2 uv, float aspect){
  if (W.w <= 0.001) return vec4(0.0);
  vec2 w = wordUv(W, uv, aspect);
  float a = sampleH(W.x, w, 0.0);
  if (a <= 0.002) return vec4(0.0);
  vec2 e = vec2(1.5 / ${ATLAS_W.toFixed(1)}, 1.5 / ${ROW.toFixed(1)});
  float hx = sampleH(W.x, w + vec2(e.x, 0.0), 1.0) - sampleH(W.x, w - vec2(e.x, 0.0), 1.0);
  float hy = sampleH(W.x, w + vec2(0.0, e.y), 1.0) - sampleH(W.x, w - vec2(0.0, e.y), 1.0);
  vec3 n = normalize(vec3(-hx * 7.0, -hy * 7.0, 1.0));
  /* brushed steel: a soft sky from above, a streak that follows the light,
     fine horizontal grain, and cold, dark lower faces */
  vec3 L = normalize(vec3(uLight, 0.9));
  float sky = 0.5 + 0.5 * n.y;
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 40.0);
  float band = exp(-pow((w.x - 0.5 - uLight.x * 0.35) * 2.4 + (w.y - 0.5) * 0.6, 2.0));
  float grain = hash(vec2(floor(w.y * 520.0), 3.0)) * 0.06;
  /* chrome: a dark horizon through the middle, bright sky above it */
  float hz = smoothstep(0.38, 0.62, w.y + n.y * 0.25);
  vec3 col = mix(vec3(0.02, 0.022, 0.028), vec3(0.26, 0.27, 0.29), hz) * (0.45 + 0.55 * sky);
  col += vec3(0.03, 0.05, 0.12) * (1.0 - hz);
  col += vec3(0.8, 0.84, 0.92) * (spec * 0.6 + band * 0.1);
  col += grain;
  col = mix(col * vec3(0.72, 0.82, 1.15), col, smoothstep(0.0, 0.6, w.y));
  return vec4(col, a * W.w);
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  /* the tiles, sized to the screen's height and nudged by the camera */
  vec2 p = (vec2(uv.x * aspect, uv.y) + uPar) * 26.0;
  vec4 hc = hexCell(p);
  float d = 0.5 - hexDist(hc.xy);
  float face = smoothstep(0.015, 0.05, d);
  float bevel = smoothstep(0.12, 0.03, d) * face;
  float tone = 0.85 + hash(hc.zw) * 0.3;
  vec3 col = vec3(0.012, 0.013, 0.016) * tone * face;
  col += vec3(0.03, 0.033, 0.04) * bevel * clamp(hc.y * 2.2, 0.0, 1.0);
  col *= 1.0 - bevel * clamp(-hc.y * 2.2, 0.0, 1.0) * 0.7;

  /* the board's light on the floor */
  vec2 q = (uv - uPool.xy) * vec2(aspect, 1.0);
  float pool = exp(-dot(q, q) * 5.0) * uPool.z;
  col += vec3(0.012, 0.026, 0.1) * pool * (0.3 + 0.7 * face);
  col += vec3(0.02, 0.045, 0.16) * pool * bevel;

  /* falls away to black at the edges */
  vec2 v = uv - 0.5;
  col *= smoothstep(0.95, 0.15, length(v * vec2(1.0, 1.25)));

  vec4 A = word(uWordA, uv, aspect);
  vec4 B = word(uWordB, uv, aspect);
  /* the word is laid down from the base up, with a bright front, the way
     the template's wordmark arrived */
  float front = uReveal * 1.1 - 0.05;
  float shown = 1.0 - smoothstep(front - 0.01, front + 0.01, uv.y);
  float edge = exp(-pow((uv.y - front) * 60.0, 2.0)) * step(uReveal, 0.999);
  col = mix(col, A.rgb, A.a * shown);
  col = mix(col, B.rgb, B.a * shown);
  col += vec3(0.3, 0.5, 1.6) * edge * max(A.a, B.a) * 0.8;
  gl_FragColor = vec4(col * uFade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export type Backdrop = ReturnType<typeof buildBackdrop>

export async function buildBackdrop(scene: THREE.Scene, family: string) {
  const font = `800 200px ${family}`
  try {
    await document.fonts.load(font, WORDS.join(""))
  } catch {
    /* fallback face */
  }
  const H = 2048
  const cv = canvas2d(ATLAS_W, H)
  const x = cv.getContext("2d")!
  x.fillStyle = "#000"
  x.fillRect(0, 0, ATLAS_W, H)
  const setFont = (size: number) => {
    x.font = `800 ${size}px ${family}`
    if ("fontStretch" in x) (x as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded"
    x.textAlign = "center"
    x.textBaseline = "alphabetic"
    if ("letterSpacing" in x) (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.02)}px`
  }
  const ink: number[] = []
  WORDS.forEach((w, i) => {
    /* set each word as large as its row allows: by height for the short
       ones, by width for the long ones */
    let size = 300
    setFont(size)
    const m = x.measureText(w)
    size = Math.floor(size * Math.min((ATLAS_W - 60) / m.width, 1))
    setFont(size)
    ink.push(Math.min(1, (x.measureText(w).width + 8) / ATLAS_W))
    const mm = x.measureText(w)
    const capH = mm.actualBoundingBoxAscent
    const base = i * ROW + ROW / 2 + capH / 2
    /* blurred height first, then the crisp coverage added on top in red */
    x.globalCompositeOperation = "lighter"
    x.filter = "blur(7px)"
    x.fillStyle = "rgb(0,255,0)"
    x.fillText(w, ATLAS_W / 2, base)
    x.filter = "none"
    x.fillStyle = "rgb(255,0,0)"
    x.fillText(w, ATLAS_W / 2, base)
    x.globalCompositeOperation = "source-over"
  })
  const tex = new THREE.CanvasTexture(cv)
  tex.flipY = false
  tex.colorSpace = THREE.NoColorSpace
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tWords: { value: tex },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPar: { value: new THREE.Vector2() },
      uPool: { value: new THREE.Vector3(0.5, 0.4, 1) },
      uWordA: { value: new THREE.Vector4(0, 0.3, 0.9, 1) },
      uWordB: { value: new THREE.Vector4(1, 0.5, 0.9, 0) },
      uLight: { value: new THREE.Vector2(0, 0.4) },
      uT: { value: 0 },
      uReveal: { value: 0 },
      uFade: { value: 1 },
      uInk: { value: ink },
    },
    vertexShader: VS,
    fragmentShader: FS,
    depthTest: false,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
  mesh.frustumCulled = false
  mesh.renderOrder = -10
  scene.add(mesh)
  return { mesh, mat, tex }
}
