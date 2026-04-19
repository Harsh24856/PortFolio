// components/ProjectsSection.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useFineHover } from "@/components/useFineHover"

const PROJECTS = [
  {
    num: "01 / Fintech", title: "Bassh.", tagline: "Real-Time Community & Event Discovery",
    stack: ["Next.js", "React Native", "Node.js", "Supabase"],
    bullets: ["Cross-platform app for discovering nearby clubs and events.", "Geolocation heatmaps visualizing real-time activity."],
    img: "/images/Baash.jpg", liveUrl: "https://bassh-green.vercel.app",
  },
  {
    num: "02 / Workflow", title: "DocSpace.", tagline: "Healthcare Verification & Hiring Platform",
    stack: ["React.js", "Node.js", "PostgreSQL", "Socket.IO"],
    bullets: ["Automated medical license validation via OCR & government registry.", "Real-time doctor–hospital messaging via Socket.IO."],
    img: "/images/Docspace.png", liveUrl: "https://doc-space-pink.vercel.app",
  },
  {
    num: "03 / HealthTech", title: "MatriCare.", tagline: "Maternal Health Risk Detection Platform",
    stack: ["React", "React Native", "Python", "ML"],
    bullets: ["Offline-first system detecting pregnancy risks via ML.", "Role-based interfaces for mothers, workers, and admins."],
    img: "/images/matri.png",
    repoUrl: "https://github.com/Harsh24856/Matri_App",
  },
]

export function ProjectsSection() {
  const [current, setCurrent] = useState(0)
  const tiltRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const goTo = (idx: number) => setCurrent((idx + PROJECTS.length) % PROJECTS.length)

  const handleMouseMove = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r || !tiltRef.current) return
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    tiltRef.current.style.transform = `perspective(1200px) rotateX(${3 - ny * 6}deg) rotateY(${nx * 5}deg) scale(1)`
  }
  const handleMouseLeave = () => {
    if (tiltRef.current)
      tiltRef.current.style.transform = "perspective(1200px) rotateX(12deg) rotateY(-4deg) scale(0.97)"
  }

  return (
    <section id="projects" className="relative py-24 bg-[#0d0d0d] overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-700/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-700/4 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-12">
          <p className="text-[10px] tracking-[0.3em] text-red-600 uppercase font-['Space_Grotesk'] mb-2">What I've Built</p>
          <h2 className="font-['Space_Grotesk'] text-5xl font-bold tracking-tight text-[#e5e2e1] leading-none">
            ENGINEERED<br/><span className="text-red-600">SYSTEMS.</span>
          </h2>
          <p className="text-xs text-[#e5e2e1]/40 mt-3 max-w-xs leading-relaxed">
            Active deployments and case studies within the kinetic grid.
          </p>
        </motion.div>

        {/* Tablet */}
        <div ref={wrapRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="w-full" style={{ perspective: "1200px" }}>
          <div ref={tiltRef} style={{ transform: "perspective(1200px) rotateX(12deg) rotateY(-4deg) scale(0.97)", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>

            {/* Tablet body */}
            <div className="bg-[#1a1a1a] rounded-[28px] p-3.5 border border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative">

              {/* Notch */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                <div className="w-2 h-2 rounded-full bg-black border border-white/5" />
                <div className="w-12 h-2.5 rounded-full bg-black border border-white/5 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-red-600/30 animate-pulse" />
                </div>
                <div className="w-2 h-2 rounded-full bg-black border border-white/5" />
              </div>

              {/* Screen */}
              <div className="bg-[#131313] rounded-[18px] overflow-hidden h-[420px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-800/10 to-transparent pointer-events-none z-0" />

                {/* Slider */}
                <div className="h-[calc(100%-48px)] overflow-hidden">
                  <div
                    className="flex h-full"
                    style={{ transform: `translateX(-${current * 100}%)`, transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}
                  >
                    {PROJECTS.map((p, i) => (
                      <div key={i} className="min-w-full h-full flex gap-6 p-8 items-center relative z-10">
                        {/* Image */}
                        <div className="flex-[0_0_46%] h-full rounded-xl overflow-hidden border border-white/5 bg-[#1c1c1c] relative group">
                          <img src={p.img} alt={p.title} className="w-full h-full object-cover opacity-75 saturate-[0.7] group-hover:opacity-95 group-hover:saturate-100 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/70 to-transparent" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] tracking-[0.2em] uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded font-['Space_Grotesk']">{p.num}</span>
                            <span className="flex-1 h-px bg-white/8" />
                          </div>
                          <h3 className="font-['Space_Grotesk'] text-3xl font-bold text-[#e5e2e1] tracking-tight">{p.title}</h3>
                          <p className="text-[11px] text-[#e5e2e1]/50 leading-relaxed">{p.tagline}</p>
                          <div className="flex flex-wrap gap-1">
                            {p.stack.map(s => (
                              <span key={s} className="text-[9px] uppercase tracking-wider text-[#e5e2e1]/40 bg-white/4 border border-white/8 px-2 py-1 rounded-sm">{s}</span>
                            ))}
                          </div>
                          <ul className="space-y-1.5">
                            {p.bullets.map((b, j) => (
                              <li key={j} className="text-[11px] text-[#e5e2e1]/55 flex gap-2 leading-relaxed">
                                <span className="text-red-500 shrink-0">▸</span><span>{b}</span>
                              </li>
                            ))}
                          </ul>
                          {(p.liveUrl || p.repoUrl) && (
                            <div className="flex flex-wrap gap-2">
                              {p.liveUrl && (
                                <a
                                  href={p.liveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white rounded font-['Space_Grotesk'] hover:opacity-85 transition shadow-[0_0_20px_rgba(226,27,35,0.25)]"
                                >
                                  Initialize ↗
                                </a>
                              )}
                              {p.repoUrl && (
                                <a
                                  href={p.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-4 py-2 border border-white/15 text-[#e5e2e1]/90 rounded font-['Space_Grotesk'] hover:border-red-500/50 hover:text-red-400 transition"
                                >
                                  <svg
                                    className="w-3.5 h-3.5 shrink-0 text-current"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden
                                  >
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                  </svg>
                                  GitHub
                                  <span aria-hidden>↗</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom nav bar inside screen */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0d0d0d]/95 border-t border-white/5 flex items-center justify-center gap-2 z-20">
                  <button onClick={() => goTo(current - 1)} className="w-7 h-7 rounded-full border border-white/10 text-white/50 hover:border-red-500 hover:text-red-500 transition text-sm flex items-center justify-center">‹</button>
                  {PROJECTS.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`w-7 h-7 rounded-full border text-[10px] font-['Space_Grotesk'] transition-all ${current === i ? "bg-red-600 border-red-600 text-white shadow-[0_0_12px_rgba(226,27,35,0.4)]" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => goTo(current + 1)} className="w-7 h-7 rounded-full border border-white/10 text-white/50 hover:border-red-500 hover:text-red-500 transition text-sm flex items-center justify-center">›</button>
                </div>
              </div>

              {/* Home bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-white/15 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}