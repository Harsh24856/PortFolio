import s from "./SceneCanvas.module.css"

/* The static stand-in for the keyboard scene, for pages that do not walk it. */
export function Backdrop() {
  return (
    <>
      <div className={s.poster} aria-hidden="true" />
      <div className={s.vignette} aria-hidden="true" />
    </>
  )
}
