"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type BlobWindow = Window & { __setBlobActive?: (v: boolean) => void }

const POINTS = 10
const BASE_R = 200
const NOISE_AMT = 28
const COMPLEXITY = 0.8
const SPRING = 0.1
const VISCOSITY = 0.06

function simplex(x: number) {
  return (
    Math.sin(x * 2.3) * 0.5 +
    Math.sin(x * 3.7 + 1.2) * 0.3 +
    Math.sin(x * 7.1 + 2.4) * 0.2
  )
}

function buildPath(
  cx: number,
  cy: number,
  pts: number[],
  angles: number[],
  sc: number,
) {
  if (sc < 0.01) return "M0,0"
  const coords = pts.map((r, i) => ({
    x: cx + Math.cos(angles[i]) * r * sc,
    y: cy + Math.sin(angles[i]) * r * sc,
  }))
  const n = coords.length
  let d = ""
  for (let i = 0; i < n; i++) {
    const p0 = coords[(i - 1 + n) % n]
    const p1 = coords[i]
    const p2 = coords[(i + 1) % n]
    const p3 = coords[(i + 2) % n]
    if (i === 0) d += `M ${p1.x} ${p1.y} `
    const cp1x = p1.x + (p2.x - p0.x) * 0.25
    const cp1y = p1.y + (p2.y - p0.y) * 0.25
    const cp2x = p2.x - (p3.x - p1.x) * 0.25
    const cp2y = p2.y - (p3.y - p1.y) * 0.25
    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `
  }
  return d + "Z"
}

export function useOrganicBlobClip() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const blobRef = useRef({ x: 0, y: 0 })
  const [clipD, setClipD] = useState("M0,0")

  useEffect(() => {
    const radii = Array(POINTS).fill(BASE_R)
    const targetR = Array(POINTS).fill(BASE_R)
    const noiseOffsets = Array.from({ length: POINTS }, () => Math.random() * 100)
    const angles = Array.from({ length: POINTS }, (_, i) => (i / POINTS) * Math.PI * 2)
    let scale = 0
    let targetScale = 0
    let time = 0
    let animId: number

    function loop() {
      time += 0.012
      const { x: mx, y: my } = mouseRef.current
      blobRef.current.x += (mx - blobRef.current.x) * SPRING
      blobRef.current.y += (my - blobRef.current.y) * SPRING
      scale += (targetScale - scale) * 0.08

      for (let i = 0; i < POINTS; i++) {
        noiseOffsets[i] += 0.018
        const n = simplex(noiseOffsets[i] + time)
        targetR[i] = BASE_R + n * NOISE_AMT * COMPLEXITY
        radii[i] += (targetR[i] - radii[i]) * VISCOSITY
      }

      setClipD(
        buildPath(blobRef.current.x, blobRef.current.y, radii, angles, scale),
      )
      animId = requestAnimationFrame(loop)
    }

    const w = window as BlobWindow
    w.__setBlobActive = (v: boolean) => {
      targetScale = v ? 1 : 0
    }
    animId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animId)
      delete w.__setBlobActive
    }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = sceneRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const setBlobActive = useCallback((active: boolean) => {
    const w = window as BlobWindow
    w.__setBlobActive?.(active)
  }, [])

  return { sceneRef, clipD, onMouseMove, setBlobActive }
}
