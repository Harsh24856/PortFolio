
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

function revealHero() {
  document.querySelectorAll("#hero [data-reveal]").forEach((el) => el.classList.add("is-in"))
}

/* the intro plays once per visit: coming back to the home page from a case
   study should land on it, not watch it load again */
let played = false
export const introPlayed = () => played

function release(pre: HTMLElement | null) {
  played = true
  document.documentElement.classList.remove("is-loading")
  if (pre) pre.style.display = "none"
}

/* The one orchestrated moment on the page. The loading bar fills, folds into
   a scan line, and the scan sweeps up the frame as the overlay lifts; the
   engine is told to start depositing the wordmark at the same instant, and
   the headline rises a beat later. */
export async function runIntro(pre: HTMLElement | null, handover: () => void) {
  const instant = played || new URLSearchParams(location.search).has("shot")
  if (!pre || reduced() || instant) {
    handover()
    revealHero()
    release(pre)
    return
  }
  /* GSAP is only needed from here on, so it is not in the first download */
  let gsap: typeof import("gsap").gsap
  try {
    gsap = (await import("gsap")).gsap
  } catch {
    handover()
    revealHero()
    release(pre)
    return
  }
  /* real time even when frames are slow: lag smoothing would otherwise
     stretch the handover on a weak device until it looked broken */
  gsap.ticker.lagSmoothing(0)
  const inner = pre.firstElementChild as HTMLElement | null
  const scan = pre.querySelector<HTMLElement>("[data-scan]")
  const bar = pre.querySelector<HTMLElement>("[data-bar]")
  const barY = bar ? bar.getBoundingClientRect().top : window.innerHeight / 2

  const tl = gsap.timeline({ onComplete: () => release(pre) })
  tl.to(inner, { autoAlpha: 0, y: -8, duration: 0.35, ease: "power2.in" }, 0.15)
  if (scan) {
    tl.set(scan, { top: barY, opacity: 1, scaleX: 0.3 }, 0.3)
      .to(scan, { scaleX: 1, duration: 0.45, ease: "power3.out" }, 0.3)
      .call(handover, undefined, 0.7)
      .to(scan, { top: -4, duration: 1.1, ease: "power2.inOut" }, 0.7)
      .to(scan, { opacity: 0, duration: 0.3 }, 1.55)
  } else tl.call(handover, undefined, 0.5)
  tl.to(pre, { backgroundColor: "rgba(0,0,0,0)", duration: 1.0, ease: "power1.inOut" }, 0.75)
    .call(revealHero, undefined, 1.15)
    .set(pre, { pointerEvents: "none" }, 0.8)
}
