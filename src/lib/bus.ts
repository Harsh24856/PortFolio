/* The page and the WebGL engine only ever talk through these window events.
   Neither side imports the other, so the engine can fail, load late or never
   load at all without the page noticing anything but a missing backdrop. */

export type BusEvents = {
  /** engine boot progress, 0..1, with the build step being run */
  "scene:progress": { p: number; step: string }
  /** the scene is built and drawing */
  "scene:ready": { tier: Tier }
  /** WebGL is unavailable or a required build step failed */
  "scene:fail": { reason: string }
  /** the preloader has handed over: start the opening sequence */
  "scene:intro": Record<string, never>
  /** how far apart the board's layers stand, 0 seated to 1 fully apart */
  "scene:assembly": { e: number }
  /** the toolkit group whose keys are lit; -1 clears */
  "scene:group": { index: number }
  /** the reader paused or resumed the scene's ambient motion */
  "scene:pause": { paused: boolean }
  /** a message was sent: a wave runs out across the keys from Enter */
  "scene:pulse": Record<string, never>
}

export type Tier = "high" | "mid" | "low"

export function emit<K extends keyof BusEvents>(type: K, detail: BusEvents[K]) {
  window.dispatchEvent(new CustomEvent(type, { detail }))
}

export function on<K extends keyof BusEvents>(type: K, fn: (detail: BusEvents[K]) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<BusEvents[K]>).detail)
  window.addEventListener(type, handler)
  return () => window.removeEventListener(type, handler)
}
