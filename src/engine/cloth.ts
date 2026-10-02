/* Cloth, ported from the original template (itself Canvas UI's Cloth taken off
   React). A 96 × 96 height field driven by a damped wave equation, wind
   gusts and a pointer brush, drawn by its own small WebGL2 context per card.

   Changed from the template: the plate now enters in blue-tinted monochrome
   and blooms to full colour on hover (uChroma), and the hairline rim takes
   the signal blue when the card is focused. The simulation is unchanged.

   Each instance hard-stops when its card leaves the viewport and again once
   the wind dies and the fabric has settled. */

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes; uniform vec2 uOut; uniform float uBleed; uniform float uFocal;
out vec2 vUv; out vec3 vNormal; out float vFold; out vec2 vLocal;
void main () {
  vUv = aGrid;
  float z = aData.x;
  vec2 nxy = aData.yz;
  vNormal = vec3(nxy, sqrt(max(1.0 - dot(nxy, nxy), 0.04)));
  vFold = aData.w;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed);
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`

const SDF = `
float fabricDist (vec2 p, vec2 size, float radius) {
  vec2 half_ = size * 0.5;
  float r = min(radius, min(half_.x, half_.y));
  vec2 q = abs(p - half_) - (half_ - vec2(r));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; in vec3 vNormal; in float vFold; in vec2 vLocal;
out vec4 outColor;
uniform sampler2D uContent; uniform float uLight;
uniform float uSheen; uniform vec3 uBacking; uniform vec2 uRes;
uniform float uRadius; uniform float uDark; uniform float uEdge;
uniform float uChroma; uniform vec3 uRim;
${SDF}
void main () {
  vec2 uv = clamp(vUv, vec2(0.001), vec2(0.999));
  vec4 tex = texture(uContent, uv);
  vec3 src = mix(uBacking, tex.rgb, tex.a);
  /* monochrome with a cold cast, blooming to the plate's own colour */
  float l = dot(src, vec3(0.2126, 0.7152, 0.0722));
  vec3 mono = mix(vec3(0.0, 0.006, 0.02), vec3(0.86, 0.9, 1.0), pow(l, 1.08));
  vec3 fabric = mix(mono, src, uChroma);
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(-0.3, 0.42, 0.86));
  float diffFlat = 0.58 + 0.42 * lightDir.z;
  float diff = 0.58 + 0.42 * dot(n, lightDir);
  float shade = mix(1.0, (diff / diffFlat) * vFold, uLight);
  vec3 lit = fabric * shade;
  vec3 halfway = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specFlat = pow(halfway.z, 34.0);
  float spec = max(pow(max(dot(n, halfway), 0.0), 34.0) - specFlat, 0.0) / (1.0 - specFlat);
  lit += uSheen * spec * mix(vec3(0.9, 0.94, 1.0), fabric, 0.35);
  float broadFlat = pow(halfway.z, 6.0);
  float broad = max(pow(max(dot(n, halfway), 0.0), 6.0) - broadFlat, 0.0) / (1.0 - broadFlat);
  lit += uDark * uLight * 0.3 * broad * vec3(1.0);
  float d = fabricDist(vLocal, uRes, uRadius);
  float hemT = smoothstep(0.0, 6.0, -d);
  lit *= mix(1.0, mix(0.93, 1.0, hemT), uLight * (1.0 - uDark));
  lit += vec3(uDark * uLight * 0.08 * (1.0 - hemT));
  /* the outline rides the same distance field that cuts the fabric out, so
     it follows every fold instead of tracing the flat box */
  float rim = smoothstep(1.05, 0.2, abs(d + 0.7));
  lit += rim * uEdge * uRim;
  float alpha = clamp(0.5 - d, 0.0, 1.0);
  outColor = vec4(clamp(lit, 0.0, 1.0), 1.0) * alpha;
}`

const SHADOW_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes; uniform vec2 uOut; uniform float uBleed;
out vec2 vLocal; out float vLift;
void main () {
  float z = aData.x;
  vLift = z;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed) + vec2(10.0, 14.0) + vec2(0.3, 0.42) * z;
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`

const SHADOW_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal; in float vLift;
out vec4 outColor;
uniform float uShadow; uniform vec2 uRes; uniform float uRadius; uniform float uDark;
${SDF}
void main () {
  float d = fabricDist(vLocal, uRes, uRadius);
  float a = uShadow * smoothstep(0.0, 30.0, -d);
  a *= mix(1.0, 0.55, clamp(vLift / 50.0, 0.0, 1.0));
  a *= mix(1.0, 0.55, uDark);
  outColor = vec4(vec3(uDark) * a, a);
}`

const SEG = 96
const NODES = SEG + 1
const DT = 1 / 120
const WAVE = 30
const STIFF = 0.55
const GAIN = 5.0
export const CLOTH_BLEED = 48

export type ClothOptions = {
  wind: number
  speed: number
  amplitude: number
  drape: number
  brush: number
  brushSize: number
  damping: number
  light: number
  sheen: number
  shadow: number
  cornerRadius: number
  perspective: number
  backing: [number, number, number]
}

const DEFAULTS: ClothOptions = {
  wind: 3,
  speed: 0.5,
  amplitude: 30,
  drape: 40,
  brush: 2.05,
  brushSize: 150,
  damping: 1,
  light: 0.5,
  sheen: 0.1,
  shadow: 0.25,
  cornerRadius: 14,
  perspective: 1200,
  backing: [0.0, 0.004, 0.012],
}

export type Cloth = {
  refresh(): void
  setHot(hot: boolean): void
  setFocus(focus: boolean): void
  dispose(): void
}

type Prog = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }

export function createCloth(
  output: HTMLCanvasElement,
  plate: () => HTMLCanvasElement | null,
  options: Partial<ClothOptions> = {},
): Cloth | null {
  const config: ClothOptions = { ...DEFAULTS, ...options }
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const wrapper = output.parentElement || output
  output.style.top = output.style.left = `${-CLOTH_BLEED}px`
  output.style.width = `calc(100% + ${CLOTH_BLEED * 2}px)`
  output.style.height = `calc(100% + ${CLOTH_BLEED * 2}px)`

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: true,
    premultipliedAlpha: true,
  })
  if (!gl || gl.isContextLost()) return null

  const compile = (type: number, text: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, text)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("Cloth:", gl.getShaderInfoLog(sh))
    return sh
  }
  const link = (v: string, f: string): Prog => {
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, v))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, f))
    gl.linkProgram(program)
    const uniforms: Prog["uniforms"] = {}
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(program, i)
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    return { program, uniforms }
  }
  const cloth = link(VERT, FRAG)
  const shadow = link(SHADOW_VERT, SHADOW_FRAG)

  const gridVerts = new Float32Array(NODES * NODES * 2)
  for (let y = 0; y < NODES; y++)
    for (let x = 0; x < NODES; x++) {
      const i = (y * NODES + x) * 2
      gridVerts[i] = x / SEG
      gridVerts[i + 1] = y / SEG
    }
  const idx = new Uint32Array(SEG * SEG * 6)
  let o = 0
  for (let y = 0; y < SEG; y++)
    for (let x = 0; x < SEG; x++) {
      const a = y * NODES + x,
        b = a + 1,
        c = a + NODES,
        d = c + 1
      idx[o++] = a
      idx[o++] = c
      idx[o++] = b
      idx[o++] = b
      idx[o++] = c
      idx[o++] = d
    }
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const gridBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf)
  gl.bufferData(gl.ARRAY_BUFFER, gridVerts, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const dataBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf)
  gl.bufferData(gl.ARRAY_BUFFER, NODES * NODES * 16, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0)
  const offBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, offBuf)
  gl.bufferData(gl.ARRAY_BUFFER, NODES * NODES * 8, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0)
  const idxBuf = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
  gl.bindVertexArray(null)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))

  function upload() {
    const c = plate()
    if (!c || !c.width) return
    gl!.bindTexture(gl!.TEXTURE_2D, tex)
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, c)
  }

  function syncSize() {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(output.clientWidth * dpr))
    const h = Math.max(1, Math.round(output.clientHeight * dpr))
    if (output.width !== w || output.height !== h) {
      output.width = w
      output.height = h
    }
  }

  let hCur = new Float32Array(NODES * NODES)
  let hPrev = new Float32Array(NODES * NODES)
  let hNext = new Float32Array(NODES * NODES)
  const vData = new Float32Array(NODES * NODES * 4)
  const oData = new Float32Array(NODES * NODES * 2)
  const zF = new Float32Array(NODES * NODES)
  const rowF = new Float32Array(NODES)
  const colF = new Float32Array(NODES)
  const hang = new Float32Array(NODES)
  for (let a = 0; a < NODES; a++) hang[a] = Math.pow(a / SEG, 1.3)

  let simTime = Math.random() * 60
  let gust = 0.5
  let energy = 1
  let edge = 0.06
  let edgeTo = 0.06
  let chroma = 0
  let chromaTo = 0
  let rim: [number, number, number] = [0.87, 0.9, 0.95]
  const ptr = { x: -1e5, y: -1e5, inside: false }
  const touch = { x: -1e5, y: -1e5, vx: 0, vy: 0, s: 0 }

  function stepSim(dt: number) {
    simTime += dt * Math.max(config.speed, 0)
    const t = simTime
    const windAmp = GAIN * Math.max(config.wind, 0) * gust
    const kb1 = (Math.PI * 2) / (SEG / 1.5)
    const kb2 = (Math.PI * 2) / (SEG / 3.8)
    const ka = (Math.PI * 2) / (SEG / 2.2)
    const w1 = WAVE * kb1
    const w2 = WAVE * kb2
    const drift = 1.8 * Math.sin(0.23 * t)
    for (let b = 0; b < NODES; b++) rowF[b] = Math.sin(kb1 * b - w1 * t + drift) + 0.45 * Math.sin(kb2 * b + w2 * t * 0.8 + 3)
    for (let a = 0; a < NODES; a++) colF[a] = (0.7 + 0.3 * Math.sin(ka * a - 1.7 * t)) * hang[a]
    const c2 = WAVE * WAVE
    const dt2 = dt * dt
    const decay = Math.exp(-Math.min(Math.max(config.damping, 0.05), 8) * dt)
    for (let y = 0; y < NODES; y++) {
      const up = Math.max(y - 1, 0) * NODES
      const down = Math.min(y + 1, SEG) * NODES
      const row = y * NODES
      for (let x = 0; x < NODES; x++) {
        const i = row + x
        const h = hCur[i]
        const lap = hCur[row + Math.max(x - 1, 0)] + hCur[row + Math.min(x + 1, SEG)] + hCur[up + x] + hCur[down + x] - 4 * h
        const force = windAmp * rowF[x] * colF[y]
        const next = 2 * h - hPrev[i] + dt2 * (c2 * lap - STIFF * h + force)
        let v = h + (next - h) * decay
        if (v > 3.5) v = 3.5
        else if (v < -3.5) v = -3.5
        hNext[i] = v
      }
    }
    for (let x = 0; x < NODES; x++) hNext[x] = 0 /* pinned along the top */
    const spent = hPrev
    hPrev = hCur
    hCur = hNext
    hNext = spent
  }

  function imprint(delta: number, width: number, height: number) {
    if (config.brush <= 0 || touch.s < 0.01) return
    const cw = width / SEG
    const ch = height / SEG
    const rx = Math.max(config.brushSize, 12) / cw
    const ry = Math.max(config.brushSize, 12) / ch
    const gx = touch.x / cw
    const gy = touch.y / ch
    const x0 = Math.max(Math.ceil(gx - 2.5 * rx), 0)
    const x1 = Math.min(Math.floor(gx + 2.5 * rx), SEG)
    const y0 = Math.max(Math.ceil(gy - 2.5 * ry), 0)
    const y1 = Math.min(Math.floor(gy + 2.5 * ry), SEG)
    const lift = 1.1 * Math.min(config.brush, 3) * touch.s
    const rate = Math.min(delta * 4, 1)
    for (let y = y0; y <= y1; y++) {
      const oy = (y - gy) / ry
      const row = y * NODES
      for (let x = x0; x <= x1; x++) {
        const ox = (x - gx) / rx
        const g = Math.exp(-(ox * ox + oy * oy))
        if (g < 0.02) continue
        const i = row + x
        const pull = rate * g
        const goal = lift * g
        hCur[i] += (goal - hCur[i]) * pull
        hPrev[i] += (goal - hPrev[i]) * pull
      }
    }
  }

  function foreshorten(stride: number, lineStride: number, ds: number, anchor: number, comp: number) {
    const ds2 = ds * ds
    for (let l = 0; l < NODES; l++) {
      const base = l * lineStride
      oData[(base + anchor * stride) * 2 + comp] = 0
      let cum = 0
      for (let k = anchor + 1; k < NODES; k++) {
        const i = base + k * stride
        const dz = zF[i] - zF[i - stride]
        cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0))
        oData[i * 2 + comp] = -cum
      }
      cum = 0
      for (let k = anchor - 1; k >= 0; k--) {
        const i = base + k * stride
        const dz = zF[i] - zF[i + stride]
        cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0))
        oData[i * 2 + comp] = cum
      }
    }
  }

  function compose(width: number, height: number) {
    const amp = Math.max(config.amplitude, 0)
    const drape = config.drape * (0.3 + 0.7 * gust)
    const cw = width / SEG
    const ch = height / SEG
    let e = 0
    for (let y = 0; y < NODES; y++) {
      const row = y * NODES
      for (let x = 0; x < NODES; x++) {
        const i = row + x
        const h = hCur[i]
        if (Math.abs(h) > e) e = Math.abs(h)
        zF[i] = amp * Math.tanh(h) + drape * hang[y]
      }
    }
    energy = e
    for (let y = 0; y < NODES; y++) {
      const up = Math.max(y - 1, 0) * NODES
      const down = Math.min(y + 1, SEG) * NODES
      const row = y * NODES
      for (let x = 0; x < NODES; x++) {
        const i = row + x
        const l = row + Math.max(x - 1, 0)
        const r = row + Math.min(x + 1, SEG)
        const dzdx = (zF[r] - zF[l]) / (2 * cw)
        const dzdy = (zF[down + x] - zF[up + x]) / (2 * ch)
        const inv = 1 / Math.hypot(dzdx, dzdy, 1)
        const curve = zF[l] + zF[r] + zF[up + x] + zF[down + x] - 4 * zF[i]
        let fold = 1 - curve * 0.01
        if (fold < 0.86) fold = 0.86
        else if (fold > 1.06) fold = 1.06
        const q = i * 4
        vData[q] = zF[i]
        vData[q + 1] = -dzdx * inv
        vData[q + 2] = -dzdy * inv
        vData[q + 3] = fold
      }
    }
    foreshorten(NODES, 1, ch, 0, 1)
    foreshorten(1, NODES, cw, SEG >> 1, 0)
  }

  const backing = config.backing
  const lum = 0.299 * backing[0] + 0.587 * backing[1] + 0.114 * backing[2]
  const dark = Math.min(Math.max((0.5 - lum) / 0.35, 0), 1)

  function draw() {
    const g = gl!
    const resW = Math.max(wrapper.clientWidth, 1)
    const resH = Math.max(wrapper.clientHeight, 1)
    const outW = Math.max(output.clientWidth, 1)
    const outH = Math.max(output.clientHeight, 1)
    const light = Math.min(Math.max(config.light, 0), 1)
    const radius = Math.max(config.cornerRadius, 0)

    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.viewport(0, 0, output.width, output.height)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    g.enable(g.BLEND)
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)

    g.bindVertexArray(vao)
    g.bindBuffer(g.ARRAY_BUFFER, dataBuf)
    g.bufferSubData(g.ARRAY_BUFFER, 0, vData)
    g.bindBuffer(g.ARRAY_BUFFER, offBuf)
    g.bufferSubData(g.ARRAY_BUFFER, 0, oData)

    g.useProgram(shadow.program)
    g.uniform2f(shadow.uniforms.uRes, resW, resH)
    g.uniform2f(shadow.uniforms.uOut, outW, outH)
    g.uniform1f(shadow.uniforms.uBleed, CLOTH_BLEED)
    g.uniform1f(shadow.uniforms.uShadow, Math.min(Math.max(config.shadow, 0), 1))
    g.uniform1f(shadow.uniforms.uRadius, radius)
    g.uniform1f(shadow.uniforms.uDark, dark)
    g.drawElements(g.TRIANGLES, idx.length, g.UNSIGNED_INT, 0)

    g.useProgram(cloth.program)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, tex)
    g.uniform1i(cloth.uniforms.uContent, 0)
    g.uniform2f(cloth.uniforms.uRes, resW, resH)
    g.uniform2f(cloth.uniforms.uOut, outW, outH)
    g.uniform1f(cloth.uniforms.uBleed, CLOTH_BLEED)
    g.uniform1f(cloth.uniforms.uFocal, Math.max(config.perspective, 200))
    g.uniform1f(cloth.uniforms.uLight, light)
    g.uniform1f(cloth.uniforms.uSheen, Math.max(config.sheen, 0))
    g.uniform1f(cloth.uniforms.uRadius, radius)
    g.uniform1f(cloth.uniforms.uDark, dark)
    g.uniform1f(cloth.uniforms.uEdge, edge)
    g.uniform1f(cloth.uniforms.uChroma, chroma)
    g.uniform3f(cloth.uniforms.uRim, rim[0], rim[1], rim[2])
    g.uniform3f(cloth.uniforms.uBacking, backing[0], backing[1], backing[2])
    g.drawElements(g.TRIANGLES, idx.length, g.UNSIGNED_INT, 0)
    g.bindVertexArray(null)
  }

  let raf = 0
  let last = performance.now()
  let debt = 0
  let running = false
  let visible = false
  let dead = false

  function frame(now: number) {
    if (dead) return
    if (!visible) {
      running = false
      return
    }
    const delta = Math.min((now - last) / 1000, 1 / 20)
    last = now
    const width = Math.max(wrapper.clientWidth, 1)
    const height = Math.max(wrapper.clientHeight, 1)
    edge += (edgeTo - edge) * Math.min(delta * 5, 1)
    chroma += (chromaTo - chroma) * Math.min(delta * (REDUCE ? 60 : 4), 1)
    if (!REDUCE) {
      const t = simTime
      const target = Math.max(0.55 + 0.35 * Math.sin(t * 0.31 + 1.3) + 0.25 * Math.sin(t * 0.83) * (0.5 + 0.5 * Math.sin(t * 0.17)), 0.15)
      gust += (target - gust) * Math.min(delta * 2, 1)
      const sT = ptr.inside && config.brush > 0 ? 1 : 0
      touch.s += (sT - touch.s) * Math.min(delta * (ptr.inside ? 8 : 2.5), 1)
      const om = 14
      touch.vx += ((ptr.x - touch.x) * om * om - 2 * om * touch.vx) * delta
      touch.vy += ((ptr.y - touch.y) * om * om - 2 * om * touch.vy) * delta
      touch.x += touch.vx * delta
      touch.y += touch.vy * delta
      imprint(delta, width, height)
      debt = Math.min(debt + delta, DT * 5)
      while (debt >= DT) {
        stepSim(DT)
        debt -= DT
      }
    }
    compose(width, height)
    draw()
    const settling = Math.abs(chroma - chromaTo) > 0.002 || Math.abs(edge - edgeTo) > 0.002
    if (!settling && (REDUCE || (config.wind <= 0.001 && energy < 0.004 && touch.s < 0.01))) {
      running = false
      return
    }
    raf = requestAnimationFrame(frame)
  }
  function start() {
    if (dead || running || !visible) return
    running = true
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  const ro = new ResizeObserver(() => {
    syncSize()
    upload()
    start()
  })
  ro.observe(output)
  const io = new IntersectionObserver((es) => {
    visible = es[es.length - 1]?.isIntersecting ?? false
    if (visible) start()
  })
  io.observe(output)
  const onMove = (e: PointerEvent) => {
    const r = wrapper.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (touch.s < 0.01) {
      touch.x = x
      touch.y = y
      touch.vx = touch.vy = 0
    }
    ptr.x = x
    ptr.y = y
    ptr.inside = true
    start()
  }
  const onLeave = () => {
    ptr.inside = false
  }
  wrapper.addEventListener("pointermove", onMove, { passive: true })
  wrapper.addEventListener("pointerleave", onLeave, { passive: true })
  wrapper.addEventListener("pointercancel", onLeave, { passive: true })
  const onHidden = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
    } else start()
  }
  document.addEventListener("visibilitychange", onHidden)

  syncSize()
  upload()
  compose(Math.max(wrapper.clientWidth, 1), Math.max(wrapper.clientHeight, 1))

  return {
    refresh() {
      syncSize()
      upload()
      start()
    },
    setHot(hot) {
      edgeTo = hot ? 0.2 : 0.06
      chromaTo = hot ? 1 : 0
      start()
    },
    setFocus(focus) {
      rim = focus ? [0.48, 0.65, 1.0] : [0.87, 0.9, 0.95]
      edgeTo = focus ? 0.55 : chromaTo > 0.5 ? 0.2 : 0.06
      chromaTo = focus ? 1 : chromaTo
      start()
    },
    dispose() {
      dead = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      wrapper.removeEventListener("pointermove", onMove)
      wrapper.removeEventListener("pointerleave", onLeave)
      wrapper.removeEventListener("pointercancel", onLeave)
      document.removeEventListener("visibilitychange", onHidden)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

/* The plate: the card's still, cover-cropped, with the scrim the label needs
   baked in so it ripples with the cloth instead of sitting flat on top. */
export function clothPlate(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, w | 0)
  c.height = Math.max(1, h | 0)
  const x = c.getContext("2d")!
  const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  x.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh)
  const g = x.createLinearGradient(0, 0, 0, c.height)
  g.addColorStop(0.4, "rgba(0,0,0,0)")
  g.addColorStop(1, "rgba(0,0,0,0.82)")
  x.fillStyle = g
  x.fillRect(0, 0, c.width, c.height)
  return c
}
