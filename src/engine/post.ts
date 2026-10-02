import * as THREE from "three"

/* The template's post chain: a four-level bloom (bright pass, separable
   blur, additive upsample) and one composite pass for tone, grade, chromatic
   fringe, vignette and grain. The grade is what changed: the warm-highs and
   teal-shadows split is gone; shadows go cold blue, highs stay neutral
   white, and saturation sits slightly under one so the frame reads as black,
   white and a little blue. */

const QUAD_VS = "varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }"

type Level = { a: THREE.WebGLRenderTarget; b: THREE.WebGLRenderTarget; w: number; h: number }

export class Post {
  scene: THREE.WebGLRenderTarget
  private levels: Level[] = []
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
  private qScene = new THREE.Scene()
  private up: THREE.ShaderMaterial
  private bright: THREE.ShaderMaterial
  private blur: THREE.ShaderMaterial
  comp: THREE.ShaderMaterial

  constructor(private renderer: THREE.WebGLRenderer, w: number, h: number, samples: number) {
    this.quad.frustumCulled = false
    this.qScene.add(this.quad)
    const O = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    }
    this.scene = new THREE.WebGLRenderTarget(w, h, { ...O, depthBuffer: true, samples })
    let lw = Math.max(2, w >> 1)
    let lh = Math.max(2, h >> 1)
    for (let i = 0; i < 4; i++) {
      this.levels.push({ a: new THREE.WebGLRenderTarget(lw, lh, O), b: new THREE.WebGLRenderTarget(lw, lh, O), w: lw, h: lh })
      lw = Math.max(2, lw >> 1)
      lh = Math.max(2, lh >> 1)
    }
    this.up = new THREE.ShaderMaterial({
      uniforms: { tS: { value: null }, uAmt: { value: 1 } },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform float uAmt; varying vec2 vUv;\nvoid main(){ gl_FragColor = vec4(texture2D(tS,vUv).rgb*uAmt, 1.0); }",
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.bright = new THREE.ShaderMaterial({
      uniforms: { tS: { value: null }, uThr: { value: 0.82 }, uKnee: { value: 0.5 } },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform float uThr; uniform float uKnee; varying vec2 vUv;\n" +
        "void main(){ vec3 c = texture2D(tS, vUv).rgb;\n" +
        " float l = dot(c, vec3(0.2126,0.7152,0.0722));\n" +
        " float k = smoothstep(uThr, uThr+uKnee, l);\n" +
        " gl_FragColor = vec4(c*k, 1.0); }",
    })
    this.blur = new THREE.ShaderMaterial({
      uniforms: { tS: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform vec2 uDir; varying vec2 vUv;\n" +
        "void main(){ vec3 c = texture2D(tS, vUv).rgb * 0.2270270270;\n" +
        " c += texture2D(tS, vUv + uDir*1.3846153846).rgb * 0.3162162162;\n" +
        " c += texture2D(tS, vUv - uDir*1.3846153846).rgb * 0.3162162162;\n" +
        " c += texture2D(tS, vUv + uDir*3.2307692308).rgb * 0.0702702703;\n" +
        " c += texture2D(tS, vUv - uDir*3.2307692308).rgb * 0.0702702703;\n" +
        " gl_FragColor = vec4(c, 1.0); }",
    })
    this.comp = new THREE.ShaderMaterial({
      uniforms: {
        tS: { value: null },
        tB: { value: null },
        uRes: { value: new THREE.Vector2(w, h) },
        uT: { value: 0 },
        uBloom: { value: 0.42 },
        uCA: { value: 1 },
        uGrain: { value: 0.016 },
        uVig: { value: 1 },
        uExp: { value: 0.72 },
        uFade: { value: 0 },
        uSat: { value: 0.7 },
      },
      vertexShader: QUAD_VS,
      fragmentShader: `
uniform sampler2D tS; uniform sampler2D tB; uniform vec2 uRes;
uniform float uT, uBloom, uCA, uGrain, uVig, uExp, uFade, uSat;
varying vec2 vUv;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec2 d = vUv - 0.5; float r2 = dot(d,d);
  float ca = uCA * (0.30 + r2*2.6) * 0.0012;
  vec3 c;
  c.r = texture2D(tS, vUv + d*ca).r;
  c.g = texture2D(tS, vUv).g;
  c.b = texture2D(tS, vUv - d*ca).b;
  c += texture2D(tB, vUv).rgb * uBloom;
  c *= uExp;
  c = aces(c);
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  c = mix(vec3(l), c, uSat);
  /* cold shadows, neutral highs */
  c = mix(c, c*vec3(0.86,0.95,1.1), smoothstep(0.45,0.0,l)*0.6);
  c = mix(c, vec3(l)*vec3(0.99,1.0,1.02), smoothstep(0.6,1.0,l)*0.35);
  float v = smoothstep(1.22, 0.26, length(d*vec2(1.0,0.94))*1.42);
  c *= mix(1.0, v, uVig);
  float g = fract(sin(dot(vUv*uRes + uT*137.0, vec2(12.9898,78.233)))*43758.5453);
  c += (g-0.5)*uGrain;
  c *= uFade;
  vec3 e = pow(max(c,0.0), vec3(1.0/2.2));
  e = clamp((e - 0.28) * 1.06 + 0.28, 0.0, 1.0);
  gl_FragColor = vec4(e, 1.0);
}`,
    })
  }

  /** compile every pass up front, one yield apart, so the first real frame
      does not pay for five shader programs at once */
  async warm(yieldFn: () => Promise<void>, parallel: boolean) {
    for (const m of [this.bright, this.blur, this.up, this.comp]) {
      this.quad.material = m
      if (parallel) await this.renderer.compileAsync(this.qScene, this.cam).catch(() => undefined)
      else this.renderer.compile(this.qScene, this.cam)
      await yieldFn()
    }
  }

  setSize(w: number, h: number) {
    this.scene.setSize(w, h)
    this.comp.uniforms.uRes.value.set(w, h)
    let lw = Math.max(2, w >> 1)
    let lh = Math.max(2, h >> 1)
    for (const L of this.levels) {
      L.a.setSize(lw, lh)
      L.b.setSize(lw, lh)
      L.w = lw
      L.h = lh
      lw = Math.max(2, lw >> 1)
      lh = Math.max(2, lh >> 1)
    }
  }

  private pass(mat: THREE.Material, target: THREE.WebGLRenderTarget | null, additive = false) {
    this.quad.material = mat
    this.renderer.setRenderTarget(target)
    if (!additive) this.renderer.clear(true, false, false)
    this.renderer.render(this.qScene, this.cam)
  }

  render(time: number, fade: number) {
    const L = this.levels
    this.bright.uniforms.tS.value = this.scene.texture
    this.pass(this.bright, L[0].a)
    for (let i = 0; i < L.length; i++) {
      if (i > 0) {
        this.up.blending = THREE.NoBlending
        this.up.uniforms.uAmt.value = 1
        this.up.uniforms.tS.value = L[i - 1].a.texture
        this.pass(this.up, L[i].a)
      }
      this.blur.uniforms.tS.value = L[i].a.texture
      this.blur.uniforms.uDir.value.set(1 / L[i].w, 0)
      this.pass(this.blur, L[i].b)
      this.blur.uniforms.tS.value = L[i].b.texture
      this.blur.uniforms.uDir.value.set(0, 1 / L[i].h)
      this.pass(this.blur, L[i].a)
    }
    this.up.blending = THREE.AdditiveBlending
    this.up.uniforms.uAmt.value = 0.55
    for (let i = L.length - 1; i > 0; i--) {
      this.up.uniforms.tS.value = L[i].a.texture
      this.pass(this.up, L[i - 1].a, true)
    }
    this.comp.uniforms.tS.value = this.scene.texture
    this.comp.uniforms.tB.value = L[0].a.texture
    this.comp.uniforms.uT.value = time
    this.comp.uniforms.uFade.value = fade
    this.pass(this.comp, null)
  }

  dispose() {
    this.scene.dispose()
    this.levels.forEach((L) => {
      L.a.dispose()
      L.b.dispose()
    })
    ;[this.up, this.bright, this.blur, this.comp].forEach((m) => m.dispose())
    this.quad.geometry.dispose()
  }
}
