/* The page and the WebGL engine only ever talk through these window events.
   Neither side imports the other, so the engine can fail, load late or never
   load at all without the page noticing anything but a missing backdrop. */

export type BusEvents = {
  /** engine boot progress, 0..1, with the fabrication step being run */
  "die:progress": { p: number; step: string }
  /** the scene is built and drawing */
  "die:ready": { tier: Tier }
  /** WebGL is unavailable or a required build step failed */
  "die:fail": { reason: string }
  /** the preloader has handed over: start the opening sequence */
  "die:intro": Record<string, never>
  /** a chapter chip or toolkit row is focused; -1 clears */
  "die:focus": { index: number }
  /** the reader paused or resumed the scene's ambient motion */
  "die:pause": { paused: boolean }
  /** a message was sent: fire a signal off the edge of the die */
  "die:pulse": Record<string, never>
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
