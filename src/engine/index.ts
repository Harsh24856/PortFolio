import * as THREE from "three"
import { emit, on, type Tier } from "@/lib/bus"
import { buildFloorplan } from "./floorplan"
import { buildEnvironment, buildWorld, updateWorld } from "./world"
import { buildWordmark, updateWordmark, type Wordmark } from "./wordmark"
import { buildPackets, type Packets } from "./packets"
import { Post } from "./post"
import { applyCamera, CAM, layoutWord, makeRig, measure, progressFor } from "./rig"
import { DIE, PODIUM, STAIRS } from "./layout"
import { REDUCE, clamp, damp, nextFrame, sat, smooth, vpH, vpW } from "./util"

/* The die world. Built in named steps so the preloader can narrate them,
   then driven by one requestAnimationFrame loop that maps the scroll onto
   the camera path. Returns a disposer. */

const STEPS = [
  "Growing the oxide",
  "Exposing the mask",
  "Etching the metal layers",
  "Depositing the gate",
  "Stacking the core",
  "Filling the memory",
  "Bonding the pins",
  "Raising the wafer",
  "Setting the type",
  "Powering on",
]

export async function startEngine(canvas: HTMLCanvasElement, opts: { tier: Tier }): Promise<() => void> {
  const reduce = REDUCE()
  const qs = new URLSearchParams(location.search)
  const shot = qs.get("shot")
  let usePost = opts.tier === "high" && qs.get("post") !== "0"
  const lite = opts.tier !== "high"
  let step = 0
  const perf = qs.has("perf") ? [] as [string, number][] : null
  let lastMark = performance.now()
  const report = async () => {
    if (perf) {
      const now = performance.now()
      perf.push([STEPS[Math.min(step, STEPS.length - 1)], Math.round(now - lastMark)])
      lastMark = now
      if (step === STEPS.length - 1) console.log("[die] build", JSON.stringify(perf))
    }
    step++
    emit("die:progress", { p: step / STEPS.length, step: STEPS[Math.min(step, STEPS.length) - 1] })
    await nextFrame()
  }
  emit("die:progress", { p: 0.02, step: STEPS[0] })

  /* ------------------------------------------------------------ renderer */
  const DPR_CAP = lite ? 1.3 : 1.6
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !usePost, alpha: false, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP))
  renderer.setSize(vpW(), vpH(), true)
  renderer.setClearColor(0x000000, 1)
  const setDirect = () => {
    renderer.toneMapping = usePost ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.95
  }
  setDirect()
  const shadows = !lite
  if (shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
  }
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  scene.fog = new THREE.FogExp2(0x010102, 0.014)
  const camera = new THREE.PerspectiveCamera(CAM[0].fov, vpW() / vpH(), 0.3, 400)
  const tmpCam = new THREE.PerspectiveCamera()
  await report()

  /* -------------------------------------------------------------- world */
  const fp = buildFloorplan(lite ? 1536 : 2048)
  await report()
  const envRT = buildEnvironment(renderer)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.32
  /* each stage of the build yields, so no single task holds the main thread
     and the preloader's step names are the work actually being done */
  const built = await buildWorld(scene, fp, { aniso, lite, shadows }, report)
  const packets: Packets = buildPackets(scene, fp.routes, lite ? 40 : 80)
  await report()
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif"
  let word: Wordmark | null = null
  try {
    word = await buildWordmark(scene, family, aniso)
  } catch (err) {
    console.warn("[die] wordmark skipped", err)
  }
  await report()

  let post: Post | null = usePost
    ? new Post(renderer, renderer.domElement.width, renderer.domElement.height, 2)
    : null
  /* spread the first frame's cost across yields: upload the big floorplan
     textures one at a time, compile the scene and the post passes, and bake
     the shadow map, so no single task holds the main thread for long */
  const tick = () => new Promise<void>((r) => setTimeout(r, 0))
  const big: THREE.Texture[] = []
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
    if (m && !Array.isArray(m)) for (const t of [m.map, m.emissiveMap]) if (t && !big.includes(t)) big.push(t)
  })
  for (const t of big) {
    renderer.initTexture(t)
    await tick()
  }
  /* parallel compilation only where the driver offers it; elsewhere the
     blocking compile still runs here, before the first frame */
  const parallel = renderer.extensions.has("KHR_parallel_shader_compile")
  if (parallel) await renderer.compileAsync(scene, camera).catch(() => renderer.compile(scene, camera))
  else renderer.compile(scene, camera)
  await tick()
  if (post) await post.warm(tick, parallel)
  if (shadows) {
    /* one throwaway render bakes the static shadow map off the first frame */
    renderer.setRenderTarget(post ? post.scene : null)
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    await tick()
  }
  await report()

  /* ---------------------------------------------------------- the rig */
  const rig = makeRig()
  const U = built.state.uniforms
  let ready = false
  let paused = document.documentElement.classList.contains("motion-paused")
  let focusTo = 0
  let focus = 0
  let glowTo = 0
  let pulseT = -1
  let intro0 = 0
  let introWanted = false
  let fade = 0
  let running = true
  let raf = 0
  let tPrev = performance.now()
  let clock = 0
  let ambient = 0
  let lastMove = 0
  const coarse = matchMedia("(pointer: coarse)").matches
  const ptr = new THREE.Vector2(0, 0)
  const cursor = new THREE.Vector2(0, -1000)
  const ray = new THREE.Raycaster()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const plateau = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PODIUM.y)
  const hit = new THREE.Vector3()

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
    ;(built.state.dust.material as THREE.ShaderMaterial).uniforms.uPx.value = h * renderer.getPixelRatio()
    layoutWord(word, tmpCam)
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

  const onPointer = (e: PointerEvent) => {
    rig.tmx = (e.clientX / vpW()) * 2 - 1
    rig.tmy = -((e.clientY / vpH()) * 2 - 1)
    if (e.pointerType === "mouse") {
      ptr.set(rig.tmx, rig.tmy)
      lastMove = performance.now()
      glowTo = 1
    }
  }
  const onLeave = () => {
    glowTo = 0
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
  document.documentElement.addEventListener("pointerleave", onLeave)
  addEventListener("resize", onResize, { passive: true })
  document.addEventListener("visibilitychange", onVis)
  const ro = new ResizeObserver(() => measure(rig))
  ro.observe(document.body)
  const offs = [
    on("die:intro", () => {
      introWanted = true
      if (ready) startIntro()
    }),
    on("die:focus", ({ index }) => (focusTo = index >= 0 ? 1 : 0)),
    on("die:pause", ({ paused: p }) => (paused = p)),
    on("die:pulse", () => {
      pulseT = 0
      packets.burst(22)
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

    rig.prog = progressFor(rig, scrollY)
    if (reduce) {
      /* no flight: the camera cuts between chapter waypoints behind a short
         dip to black, and never drifts with the pointer */
      const to = Math.round(rig.prog)
      if (to !== cutTo) {
        cutTo = to
        cutAt = now
        document.documentElement.classList.add("die-cut")
      }
      if (cutAt && now - cutAt > 140) {
        rig.smooth = cutTo
        cutAt = 0
        requestAnimationFrame(() => document.documentElement.classList.remove("die-cut"))
      }
      rig.mx = rig.my = 0
    } else {
      rig.smooth = damp(rig.smooth, rig.prog, 5.2, dt)
      rig.mx = damp(rig.mx, coarse ? 0 : rig.tmx, 2.6, dt)
      rig.my = damp(rig.my, coarse ? 0 : rig.tmy, 2.6, dt)
    }
    if (intro0) {
      const el = (now - intro0) / 1000
      rig.intro = reduce ? 1 : sat(el / 2.6)
      fade = reduce ? 1 : sat(el / 0.8)
    }
    applyCamera(rig, camera)

    /* the cursor's light on the die: where the pointer ray meets the metal,
       or a slow scanner sweeping the frame on touch screens */
    const still = reduce || paused
    if (!still && (coarse || performance.now() - lastMove > 6000)) {
      const a = clock * 0.23
      ptr.set(Math.sin(a) * 0.55, -0.35 + Math.sin(a * 1.7) * 0.25)
      glowTo = coarse ? 0.65 : glowTo * 0.995
    }
    ray.setFromCamera(ptr, camera)
    if (ray.ray.intersectPlane(plateau, hit) && hit.x > PODIUM.x0 && hit.x < PODIUM.x1 && hit.z > PODIUM.z0 && hit.z < STAIRS.zBack) {
      cursor.set(hit.x, hit.z)
    } else if (ray.ray.intersectPlane(ground, hit)) cursor.set(hit.x, hit.z)
    U.uCursor.value.lerp(cursor, 1 - Math.exp(-10 * dt))
    U.uGlow.value = damp(U.uGlow.value, glowTo * (1 - smooth(5, 6, rig.smooth) * 0.7), 4, dt)

    focus = damp(focus, focusTo, 5, dt)
    if (pulseT >= 0) {
      pulseT += dt
      U.uPulseO.value.set(0, DIE.z1 - 1.5)
      U.uPulseR.value = pulseT * 34
      U.uPulseA.value = Math.max(0, 1 - pulseT / 2.2)
      if (pulseT > 2.4) pulseT = -1
    }
    if (!still) ambient += dt
    updateWorld(built.state, built.cellSize, ambient, dt, focus, still)
    packets.update(dt, still)
    if (word) {
      let reveal = 0
      if (intro0) reveal = reduce || shot !== null ? 1.4 : Math.min(1.4, (now - intro0) / 1600)
      updateWordmark(word, reveal, rig.smooth, clock)
    }

    /* the air thins as the camera climbs for the die shot */
    ;(scene.fog as THREE.FogExp2).density = 0.014 * (1 - smooth(4.6, 6, rig.smooth) * 0.8)

    if (post) {
      renderer.setRenderTarget(post.scene)
      renderer.clear(true, true, false)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      post.render(clock, intro0 ? fade : 0)
    } else {
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
    }

    if (perf && frames < 2) {
      perf.push([`frame ${frames}`, Math.round(performance.now() - now)])
      if (frames === 1) console.log("[die] first frames", JSON.stringify(perf.slice(-2)))
    }
    if (!ready && ++frames >= 2) {
      ready = true
      document.documentElement.classList.add("die-ready")
      emit("die:ready", { tier: opts.tier })
      if (introWanted || shot !== null) startIntro()
    }
    raf = requestAnimationFrame(frame)
  }

  resize()
  if (shot !== null) {
    const n = clamp(parseInt(shot, 10) || 0, 0, CAM.length - 1)
    measure(rig)
    scrollTo(0, rig.anchors[n] ?? 0)
    rig.smooth = rig.prog = progressFor(rig, rig.anchors[n] ?? 0)
    rig.intro = 1
    intro0 = performance.now() - 10000
  }
  raf = requestAnimationFrame(frame)
  ;(window as unknown as { __die: unknown }).__die = { rig, camera, renderer, scene }

  return () => {
    running = false
    cancelAnimationFrame(raf)
    removeEventListener("pointermove", onPointer)
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
    renderer.dispose()
    document.documentElement.classList.remove("die-ready")
  }
}
