"use client"

import { useEffect, useRef, useState } from "react"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { ContactSection } from "@/components/ContactSection"
import { HeroScene } from "@/components/HeroScene"
import { Navbar } from "@/components/Navbar"
import { ProjectsSection } from "@/components/ProjectsSection"
import { SkillsSection } from "@/components/SkillsSection"

export default function Home() {
  const boundaryRef = useRef<HTMLDivElement>(null)
  const [isLocked, setIsLocked] = useState(true)

  // Lock scrolling for the first 2 seconds during the intro splash
  useEffect(() => {
    // Prevent browser from restoring previous scroll position
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    // Force scroll to top instantly
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })

    document.body.style.overflow = "hidden"
    const timer = setTimeout(() => {
      document.body.style.overflow = ""
      setIsLocked(false)
    }, 2000)

    return () => {
      document.body.style.overflow = ""
      clearTimeout(timer)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: boundaryRef,
    offset: ["start end", "start 0.22"],
  })

  const heroY = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -40]),
    { stiffness: 90, damping: 28, mass: 0.85 },
  )
  const heroOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.9, 0.82]),
    { stiffness: 90, damping: 30, mass: 0.85 },
  )

  const projectsY = useSpring(
    useTransform(scrollYProgress, [0, 1], [72, 0]),
    { stiffness: 100, damping: 26, mass: 0.7 },
  )
  const projectsOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.15, 1], [0.2, 1, 1]),
    { stiffness: 110, damping: 28 },
  )

  return (
    <>
      {isLocked && (
        <style dangerouslySetInnerHTML={{ __html: `
          body { 
            overflow: hidden !important; 
            touch-action: none !important;
            height: 100vh !important;
          }
        `}} />
      )}
      <Navbar />
      <main className="relative">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-0 min-h-screen min-h-[100dvh] shrink-0 snap-start snap-always will-change-transform max-w-[100vw]"
        >
          <HeroScene />
        </motion.div>

        {/* Scroll boundary: hero → projects (1px for stable useScroll) */}
        <div
          ref={boundaryRef}
          className="pointer-events-none relative z-[1] h-px w-full shrink-0 bg-gradient-to-r from-transparent via-red-500/35 to-transparent"
          aria-hidden
        />

        <motion.div
          style={{ y: projectsY, opacity: projectsOpacity }}
          className="relative z-[1] shrink-0 snap-start will-change-transform"
        >
          <ProjectsSection />
        </motion.div>

        <div className="snap-start">
          <SkillsSection />
        </div>
        <div className="snap-start">
          <ContactSection />
        </div>
      </main>
    </>
  )
}
