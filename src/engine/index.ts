import * as THREE from "three"
import { emit, on, type Tier } from "@/lib/bus"
import { toolGroups } from "@/content/toolkit"
import { buildEnvironment, buildKeyboard } from "./keyboard"
import { buildBackdrop, WORDS } from "./backdrop"
import { KEYS, keyCenter, keyIndex } from "./board"
import { Post } from "./post"
import { applyCamera, CAM, makeRig, measure, narrowness, progressFor, station } from "./rig"
import { REDUCE, clamp, damp, nextFrame, sat, smooth, vpH, vpW } from "./util"

/* The keyboard scene. Built in named steps so the preloader can narrate
   them, then driven by one requestAnimationFrame loop that maps the scroll
   onto the camera path, the layers' separation and the x-ray cut. Returns a
   disposer. */

const STEPS = [
  "Starting the renderer",
  "Milling the tray",
  "Cutting the diffuser",
  "Seating the switches",
  "Machining the case",
  "Printing the legends",
  "Moulding the caps",
  "Casting the type",
  "Lighting the board",
]

const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role=button], [data-cursor]"

export async function startEngine(canvas: HTMLCanvasElement, opts: { tier: Tier }): Promise<() => void> {
  const reduce = REDUCE()
  const qs = new URLSearchParams(location.search)
  const shot = qs.get("shot")
  let usePost = opts.tier === "high" && qs.get("post") !== "0"
  const lite = opts.tier !== "high"
  let step = 0
  const perf = qs.has("perf") ? ([] as [string, number][]) : null
  let lastMark = performance.now()
  const report = async () => {
    if (perf) {
      const now = performance.now()
      perf.push([STEPS[Math.min(step, STEPS.length - 1)], Math.round(now - lastMark)])
      lastMark = now
      if (step === STEPS.length - 1) console.log("[scene] build", JSON.stringify(perf))
    }
    step++
    emit("scene:progress", { p: step / STEPS.length, step: STEPS[Math.min(step, STEPS.length - 1)] })
    await nextFrame()
  }
  emit("scene:progress", { p: 0.02, step: STEPS[0] })

  /* ------------------------------------------------------------ renderer */
  const DPR_CAP = lite ? 1.4 : 1.75
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !usePost, alpha: false, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP))
  renderer.setSize(vpW(), vpH(), true)
  renderer.setClearColor(0x000000, 1)
  const setDirect = () => {
    renderer.toneMapping = usePost ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
  }
  setDirect()
  const shadows = !lite
  if (shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
  }
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CAM[0].fov, vpW() / vpH(), 0.3, 200)
  const envRT = buildEnvironment(renderer)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.55

  /* a key light from the front left, a cold rim from behind */
  const key = new THREE.DirectionalLight(0xfff6ec, 2.4)
  key.position.set(-7, 14, 9)
  if (shadows) {
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    const c = key.shadow.camera
    c.left = -11
    c.right = 11
    c.top = 11
    c.bottom = -11
    c.near = 1
    c.far = 40
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
  }
  const rim = new THREE.DirectionalLight(0x8aa6ff, 0.9)
  rim.position.set(6, 4, -10)
  scene.add(key, rim, new THREE.HemisphereLight(0xc8d0e0, 0x050507, 0.2))
  await report()

  /* --------------------------------------------------------------- world */
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif"
  const kb = await buildKeyboard(
    scene,
    { aniso, shadows, family, toolNames: toolGroups.map((g) => g.tools) },
    report,
  )
  const back = await buildBackdrop(scene, family)
  const BU = back.mat.uniforms
  await report()

  let post: Post | null = usePost ? new Post(renderer, renderer.domElement.width, renderer.domElement.height, 2) : null
  const grade = () => {
    if (!post) return
    const u = post.comp.uniforms
    u.uExp.value = 1.0
    u.uSat.value = 0.88
    u.uBloom.value = 0.5
  }
  grade()
  /* spread the first frame's cost: textures up one at a time, the scene
     and the post passes compiled, the shadow map baked, each a yield apart */
  const tick = () => new Promise<void>((r) => setTimeout(r, 0))
  for (const t of [kb.legendTex, back.tex]) {
    renderer.initTexture(t)
    await tick()
  }
  const parallel = renderer.extensions.has("KHR_parallel_shader_compile")
  if (parallel) await renderer.compileAsync(scene, camera).catch(() => renderer.compile(scene, camera))
  else renderer.compile(scene, camera)
  await tick()
  if (post) await post.warm(tick, parallel)
  await report()

  /* ----------------------------------------------------------- the rig */
  const rig = makeRig()
  let ready = false
  let paused = document.documentElement.classList.contains("motion-paused")
  let explodeTo = 0
  let group = -1
  let intro0 = 0
  let introWanted = false
  let fade = 0
  let running = true
  let raf = 0
  let tPrev = performance.now()
  let clock = 0
  let ambient = 0
  let lastMove = 0
  let ptrDirty = false
  const coarse = matchMedia("(pointer: coarse)").matches
  const ptr = new THREE.Vector2(0, 0)
  const ray = new THREE.Raycaster()
  const queue: { at: number; i: number; hold?: number }[] = []
  const typed = { done: false }
  const centre = new THREE.Vector3()

  const startIntro = () => {
    if (intro0) return
    intro0 = performance.now()
  }

  const resize = () => {
    const w = vpW()
    const h = vpH()
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP) * gov.scale)
    renderer.setSize(w, h, true)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    post?.setSize(renderer.domElement.width, renderer.domElement.height)
    BU.uRes.value.set(w, h)
    measure(rig)
  }

  /* trades resolution for frame rate on unknown hardware, and drops the
     bloom chain entirely if that is still not enough */
  const gov = { scale: 1, acc: 0, n: 0 }
  const govern = (raw: number) => {
    if (clock < 2.5 || shot !== null) return
    gov.acc += raw
    gov.n++
    if (gov.n < 40 && gov.acc < 0.9) return
    const avg = gov.acc / gov.n
    gov.acc = 0
    gov.n = 0
    if (avg > 0.024 && gov.scale > 0.6) {
      gov.scale = Math.max(0.6, gov.scale * (avg > 0.05 ? 0.66 : 0.86))
      resize()
    } else if (avg > 0.03 && post) {
      post.dispose()
      post = null
      usePost = false
      setDirect()
      resize()
    } else if (avg < 0.0135 && gov.scale < 1) {
      gov.scale = Math.min(1, gov.scale + 0.08)
      resize()
    }
  }

  /* ------------------------------------------------------------ input */
  const onPointer = (e: PointerEvent) => {
    rig.tmx = (e.clientX / vpW()) * 2 - 1
    rig.tmy = -((e.clientY / vpH()) * 2 - 1)
    if (e.pointerType === "mouse") {
      ptr.set(rig.tmx, rig.tmy)
      lastMove = performance.now()
      ptrDirty = true
    }
  }
  let hovered = -1
  const onDown = (e: PointerEvent) => {
    if (hovered < 0 || e.button !== 0) return
    const t = e.target as Element | null
    if (t?.closest?.(INTERACTIVE)) return
    kb.press(hovered, 0.14)
  }
  /* the real keyboard drives the drawn one: every key you press anywhere on
     the page, the form included, presses its twin */
  const onKey = (e: KeyboardEvent) => {
    const i = keyIndex.get(e.code)
    if (i !== undefined) kb.press(i, e.repeat ? 0.05 : 0.11)
  }
  const onLeave = () => {
    hovered = -1
    kb.setHover(-1)
  }
  const onResize = () => resize()
  const onVis = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
    } else if (!running) {
      running = true
      tPrev = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  addEventListener("pointermove", onPointer, { passive: true })
  addEventListener("pointerdown", onDown, { passive: true })
  addEventListener("keydown", onKey, { passive: true })
  document.documentElement.addEventListener("pointerleave", onLeave)
  addEventListener("resize", onResize, { passive: true })
  document.addEventListener("visibilitychange", onVis)
  const ro = new ResizeObserver(() => measure(rig))
  ro.observe(document.body)

  const typeWord = (word: string, from: number, gap: number) => {
    ;[...word].forEach((ch, n) => {
      const i = keyIndex.get(`Key${ch}`)
      if (i !== undefined) queue.push({ at: from + n * gap, i })
    })
  }
  const offs = [
    on("scene:intro", () => {
      introWanted = true
      if (ready) startIntro()
    }),
    on("scene:assembly", ({ e }) => (explodeTo = sat(e))),
    on("scene:group", ({ index }) => (group = index)),
    on("scene:pause", ({ paused: p }) => (paused = p)),
    on("scene:pulse", () => {
      /* a wave out from Enter: every key goes down in turn by distance */
      const src = keyCenter(KEYS[keyIndex.get("Enter") ?? 0])
      const now = performance.now()
      KEYS.forEach((k, i) => {
        const c = keyCenter(k)
        const d = Math.hypot(c.x - src.x, (c.z - src.z) * 1.2)
        queue.push({ at: now + (reduce ? 0 : d * 55), i, hold: 0.08 })
      })
    }),
  ]

  /* ----------------------------------------------------------- the loop */
  let frames = 0
  let cutTo = -1
  let cutAt = 0
  function frame(now: number) {
    if (!running) return
    const raw = (now - tPrev) / 1000 || 0
    const dt = Math.min(raw, 0.05)
    tPrev = now
    clock += dt
    govern(raw)
    const still = reduce || paused

    rig.prog = progressFor(rig, scrollY)
    if (reduce) {
      /* no flight: the camera cuts between stations behind a short dip to
         black, and never drifts with the pointer */
      const to = Math.round(rig.prog)
      if (to !== cutTo) {
        cutTo = to
        cutAt = now
        document.documentElement.classList.add("scene-cut")
      }
      if (cutAt && now - cutAt > 140) {
        rig.smooth = cutTo
        cutAt = 0
        requestAnimationFrame(() => document.documentElement.classList.remove("scene-cut"))
      }
      rig.mx = rig.my = 0
    } else {
      rig.smooth = damp(rig.smooth, rig.prog, 5.2, dt)
      rig.mx = damp(rig.mx, coarse ? 0 : rig.tmx, 2.6, dt)
      rig.my = damp(rig.my, coarse ? 0 : rig.tmy, 2.6, dt)
    }
    let introT = 0
    if (intro0) {
      introT = (now - intro0) / 1000
      rig.intro = reduce ? 1 : sat(introT / 2.8)
      rig.intro = rig.intro * rig.intro * (3 - 2 * rig.intro)
      fade = reduce ? 1 : sat(introT / 0.7)
      if (!typed.done && !still && shot === null && introT > 0) {
        typed.done = true
        typeWord("HARSH", now + 2300, 150)
      }
    }
    applyCamera(rig, camera)

    /* the cut: swept across the board as it arrives, then wherever the
       station puts it, leaning a little toward the pointer on the hero */
    const s = rig.smooth
    const sweep = reduce || shot !== null ? 1 : smooth(0.35, 2.6, introT)
    const hero = 1 - smooth(0.2, 0.8, s)
    const rest = station(s, (c) => c.scan) + (still ? 0 : rig.mx * 1.2 * hero)
    const scan = intro0 ? 10.5 + (rest - 10.5) * sweep : 10.5

    /* pointer over a cap: lift it a hair; resting the mouse a while lets the
       board settle back */
    if (ptrDirty && !coarse) {
      ptrDirty = false
      ray.setFromCamera(ptr, camera)
      const i = performance.now() - lastMove < 4000 ? kb.pickKey(ray.ray) : -1
      if (i !== hovered) {
        hovered = i
        kb.setHover(i)
      }
    }
    if (queue.length) {
      queue.sort((p, q) => p.at - q.at)
      while (queue.length && queue[0].at <= now) {
        const q = queue.shift()!
        kb.press(q.i, q.hold ?? 0.1)
      }
    }

    if (!still) ambient += dt
    kb.update({
      dt,
      explode: explodeTo * (1 - smooth(0.55, 0.95, Math.abs(s - 1))),
      scan,
      lineAlpha: intro0 ? 1 : 0,
      group,
      groupWeight: 1 - smooth(0.35, 0.8, Math.abs(s - 2)),
      ambient,
      still,
    })

    /* backdrop: the station's word, crossfading between stations, and the
       light pool under wherever the board sits on screen */
    const a = clamp(Math.floor(s), 0, WORDS.length - 1)
    const b = clamp(a + 1, 0, WORDS.length - 1)
    const f = smooth(0.25, 0.75, s - a)
    const wa = CAM[a].word
    const wb = CAM[b].word
    /* on a tall screen the hero's copy fills the foot of the frame, so its
       word rises to sit just under the board */
    const lift = (i: number) => (i === 0 ? narrowness() * 0.24 : 0)
    BU.uWordA.value.set(a, wa[0] + lift(a) + f * 0.05, wa[1], wa[2] * (1 - f))
    BU.uWordB.value.set(b, wb[0] + lift(b) - (1 - f) * 0.05, wb[1], wb[2] * f)
    centre.copy(kb.centre()).project(camera)
    BU.uPool.value.set(centre.x * 0.5 + 0.5, centre.y * 0.5 + 0.5, 1 + kb.stackGap() * 0.12)
    BU.uPar.value.set(camera.position.x * 0.004, camera.position.y * 0.003)
    BU.uLight.value.set(rig.mx * 0.9, 0.4 + rig.my * 0.4)
    BU.uT.value = clock
    BU.uReveal.value = intro0 ? (reduce || shot !== null ? 1.2 : Math.min(1.2, introT / 1.5)) : 0

    if (post) {
      renderer.setRenderTarget(post.scene)
      renderer.clear(true, true, false)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      post.render(clock, intro0 ? fade : 0)
    } else {
      BU.uFade.value = intro0 ? fade : 0
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
    }

    if (perf && frames < 2) {
      perf.push([`frame ${frames}`, Math.round(performance.now() - now)])
      if (frames === 1) console.log("[scene] first frames", JSON.stringify(perf.slice(-2)))
    }
    if (!ready && ++frames >= 2) {
      ready = true
      document.documentElement.classList.add("scene-ready")
      emit("scene:ready", { tier: opts.tier })
      if (introWanted || shot !== null) startIntro()
    }
    raf = requestAnimationFrame(frame)
  }

  resize()
  if (shot !== null) {
    const n = clamp(parseInt(shot, 10) || 0, 0, CAM.length - 1)
    measure(rig)
    const y = rig.anchors.find((x) => x.v === n)?.y ?? 0
    scrollTo(0, y)
    rig.smooth = rig.prog = progressFor(rig, y)
    rig.intro = 1
    intro0 = performance.now() - 10000
  }
  raf = requestAnimationFrame(frame)
  ;(window as unknown as { __scene: unknown }).__scene = { rig, camera, renderer, scene, kb }

  return () => {
    running = false
    cancelAnimationFrame(raf)
    removeEventListener("pointermove", onPointer)
    removeEventListener("pointerdown", onDown)
    removeEventListener("keydown", onKey)
    document.documentElement.removeEventListener("pointerleave", onLeave)
    removeEventListener("resize", onResize)
    document.removeEventListener("visibilitychange", onVis)
    ro.disconnect()
    offs.forEach((f) => f())
    post?.dispose()
    envRT.dispose()
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
      mats.forEach((mt) => {
        Object.values(mt).forEach((v) => (v as THREE.Texture | undefined)?.isTexture && (v as THREE.Texture).dispose())
        mt.dispose()
      })
    })
    kb.legendTex.dispose()
    back.tex.dispose()
    renderer.dispose()
    document.documentElement.classList.remove("scene-ready")
  }
}
