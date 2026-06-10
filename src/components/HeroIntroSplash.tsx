"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const SPLASH_MS = 2000

export function HeroIntroSplash() {
  const [visible, setVisible] = useState(true)
  const [isRed, setIsRed] = useState(true)

  useEffect(() => {
    const hideId = window.setTimeout(() => setVisible(false), SPLASH_MS)

    // Toggle black <-> red every 500ms
    const toggleId = window.setInterval(() => {
      setIsRed((prev) => !prev)
    }, 500)

    return () => {
      window.clearTimeout(hideId)
      window.clearInterval(toggleId)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030303] px-6 pb-[env(safe-area-inset-bottom)] font-[family-name:var(--font-geist-sans)] max-w-[100vw] overflow-x-hidden"
      aria-hidden
    >
      {/* Logo / image */}
      <div className="mb-6 h-100 w-100 shrink-0 sm:h-100 sm:w-100 relative">
        <Image
          src="/images/image.png"
          alt="Logo"
          fill
          sizes="(max-width: 640px) 256px, 400px"
          className="object-contain"
          preload
        />
      </div>

      {/* Welcome text with letter-by-letter black/red toggle */}
      <p className="text-center text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight select-none break-words max-w-full">
        {"Welcome".split("").map((letter, i) => (
          <span
            key={i}
            className="inline-block transition-colors duration-150"
            style={{
              color: isRed
                ? i % 2 === 0 ? "#ef4444" : "#000000"
                : i % 2 === 0 ? "#000000" : "#ef4444",
              textShadow: isRed && i % 2 === 0
                ? "0 0 20px rgba(239,68,68,0.5)"
                : "none",
            }}
          >
            {letter}
          </span>
        ))}
      </p>

      {/* Web spinner below */}
      <div className="mt-8 relative w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-full h-full animate-spin" style={{ animationDuration: "2s" }}>
          <circle cx="16" cy="16" r="12" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3"/>
          <circle cx="16" cy="16" r="7" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5"/>
          <line x1="16" y1="4" x2="16" y2="28" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4"/>
          <line x1="4" y1="16" x2="28" y2="16" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4"/>
          <line x1="7" y1="7" x2="25" y2="25" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4"/>
          <line x1="25" y1="7" x2="7" y2="25" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  )
}