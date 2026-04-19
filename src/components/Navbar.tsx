"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

const SPLASH_MS = 2000 // must match HeroIntroSplash duration

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
]

export function Navbar() {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  /* ── Hide during intro splash ──────────────────── */
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), SPLASH_MS)
    return () => window.clearTimeout(id)
  }, [])

  /* ── Scroll detection ──────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* ── Active section tracking ───────────────────── */
  useEffect(() => {
    const ids = ["home", "projects", "skills", "contact"]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id)
        })
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback(
    (href: string) => {
      setMobileOpen(false)
      const id = href.replace("#", "")
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    },
    [],
  )

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          !visible
            ? "opacity-0 -translate-y-4 pointer-events-none"
            : "opacity-100 translate-y-0"
        } ${
          scrolled
            ? "bg-neutral-950/60 backdrop-blur-2xl shadow-[0_0_40px_rgba(226,27,35,0.05)] border-b border-white/[0.04] py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-16 flex items-center justify-between">
          {/* Brand */}
          <button
            onClick={() => scrollTo("#home")}
            className="cursor-pointer hover:opacity-80 transition-opacity duration-300 relative w-10 h-10 rounded-full"
            id="nav-brand"
          >
            <Image
              src="/images/screen.png"
              alt="Logo"
              fill
              className="object-contain"
              preload
            />
          </button>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => {
              const isActive = activeSection === l.href.replace("#", "")
              return (
                <li key={l.href}>
                  <button
                    onClick={() => scrollTo(l.href)}
                    id={`nav-${l.label.toLowerCase()}`}
                    className={`relative font-sans text-[11px] tracking-[0.15em] uppercase cursor-pointer transition-all duration-500 py-1 ${
                      isActive
                        ? "text-[#e21b23] font-bold"
                        : "text-[#e5e2e1]/40 hover:text-[#e5e2e1] hover:bg-[#e21b23]/5"
                    }`}
                  >
                    {l.label}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#e21b23] rounded-full" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2"
            aria-label="Toggle menu"
            id="nav-mobile-toggle"
          >
            <span
              className={`block w-6 h-0.5 bg-[#e5e2e1] transition-all duration-300 origin-center ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#e5e2e1] transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#e5e2e1] transition-all duration-300 origin-center ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-neutral-950/95 backdrop-blur-2xl border-l border-[#5d3f3c]/15 p-8 pt-24 transition-transform duration-500 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* HUD indicator */}
          <div className="absolute top-6 right-6 flex items-center gap-2 opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-[#e21b23] animate-pulse" />
            <span className="font-sans text-[8px] tracking-[0.2em] text-[#e5e2e1] uppercase">
              Nav_Active
            </span>
          </div>

          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => {
              const isActive = activeSection === l.href.replace("#", "")
              return (
                <li key={l.href}>
                  <button
                    onClick={() => scrollTo(l.href)}
                    className={`w-full text-left px-4 py-3 font-sans text-lg uppercase tracking-tight cursor-pointer transition-all duration-500 rounded-sm ${
                      isActive
                        ? "text-[#e21b23] bg-[#e21b23]/10 font-bold"
                        : "text-neutral-400 hover:text-[#e5e2e1] hover:bg-[#e21b23]/5"
                    }`}
                  >
                    {l.label}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Bottom branding */}
          <div className="absolute bottom-8 left-8 right-8">
            <div className="h-px bg-[#5d3f3c]/20 mb-4" />
            <p className="font-sans text-[8px] tracking-[0.25em] text-[#e5e2e1]/20 uppercase">
              © {new Date().getFullYear()} H_Sehra
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
