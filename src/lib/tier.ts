import type { Tier } from "./bus"

/* Decide how much scene this device gets before downloading any of it.
   high: everything, with the bloom chain.  mid: the world without post.
   low: no WebGL at all; a static poster stands in. The engine can still
   step down from high to mid if the first frames run slow. */
export function pickTier(): Tier {
  const q = new URLSearchParams(location.search).get("tier")
  if (q === "high" || q === "mid" || q === "low") return q

  /* a feature check, not a probe context: creating a throwaway WebGL
     context costs as much as the real one. If the real one then fails, the
     engine reports it and the poster stays. */
  if (typeof WebGL2RenderingContext === "undefined") return "low"

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return "low"
  if ((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2) return "low"
  if (matchMedia("(pointer: coarse)").matches || innerWidth < 860) return "mid"
  return "high"
}
