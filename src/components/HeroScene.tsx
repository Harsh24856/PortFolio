"use client"

import { useState } from "react"
import { HeroBaseImage } from "@/components/HeroBaseImage"
import { HeroCaptionOverlay } from "@/components/HeroCaptionOverlay"
import { HeroIntroSplash } from "@/components/HeroIntroSplash"
import { HeroRevealSvg } from "@/components/HeroRevealSvg"
import { useOrganicBlobClip } from "@/components/useOrganicBlobClip"

const BASE_SRC = "/images/harsh.png"
const REVEAL_SRC = "/images/12.png"

export function HeroScene() {
  const { sceneRef, clipD, onMouseMove, onTouchMove, setBlobActive } =
    useOrganicBlobClip()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      id="home"
      ref={sceneRef}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseEnter={() => {
        setIsHovered(true)
        setBlobActive(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setBlobActive(false)
      }}
      onTouchStart={(e) => {
        setIsHovered(true)
        setBlobActive(true)
        onTouchMove(e)
      }}
      onTouchEnd={(e) => {
        if (e.touches.length === 0) {
          setIsHovered(false)
          setBlobActive(false)
        }
      }}
      className="relative w-full min-h-screen min-h-[100dvh] overflow-x-hidden overflow-y-hidden touch-pan-y bg-[#030303] text-white max-w-[100vw] cursor-none md:cursor-none"
    >
      <HeroBaseImage src={BASE_SRC} />
      <HeroRevealSvg clipD={clipD} revealSrc={REVEAL_SRC} />
      <HeroCaptionOverlay
        visible={isHovered}
        kicker="Software Engineer · Full-Stack & Mobile"
        name="Harsh Sehra"
        subtitle="Punjab Engineering College · B.Tech Computer Science · 2024 – 2028"
      />
      <HeroIntroSplash />

      {/* scroll-down indicator */}
      <button
        type="button"
        onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
        className="scroll-indicator absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[4] flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]"
        aria-label="Scroll down"
      >
        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Scroll</span>
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}
