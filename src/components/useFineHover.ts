"use client"

import { useEffect, useState } from "react"

/** True when the device reports hover + fine pointer (mouse / trackpad), not primary touch. */
export function useFineHover() {
  const [fine, setFine] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return fine
}
