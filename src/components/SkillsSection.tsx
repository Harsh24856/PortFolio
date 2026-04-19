// components/SkillsSection.tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

/* ── Skill data ──────────────────────────────────── */

type SkillBar = { name: string; level: number }

const FRONTEND: SkillBar[] = [
  { name: "React & Next.js", level: 92 },
  { name: "React Native / Expo", level: 85 },
  { name: "TypeScript", level: 82 },
  { name: "Tailwind CSS & Framer Motion", level: 80 },
]

const BACKEND: SkillBar[] = [
  { name: "Node.js & Express", level: 90 },
  { name: "Python", level: 78 },
  { name: "REST API Design", level: 90 },
  { name: "Socket.IO / Real-Time", level: 82 },
]

const DATA_CLOUD: SkillBar[] = [
  { name: "PostgreSQL", level: 85 },
  { name: "Supabase", level: 88 },
  { name: "Docker & CI/CD", level: 72 },
  { name: "Vercel / Deployment", level: 80 },
]

const CORE_LANGUAGES = ["JavaScript", "TypeScript", "Python", "C++", "Java"]
const METHODOLOGIES = [
  "System Design",
  "OCR & Web Automation",
  "Machine Learning",
  "Git & Version Control",
  "Agile / Scrum",
]

/* ── Animated bar ────────────────────────────────── */

function AnimatedBar({
  name,
  level,
  delay,
  active,
}: SkillBar & { delay: number; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <div ref={ref}>
      <div className="flex justify-between items-end mb-2">
        <span className="font-['Space_Grotesk'] text-[11px] tracking-[0.15em] text-[#e7bdb8] uppercase">
          {name}
        </span>
        <span
          className={`font-['Space_Grotesk'] text-lg font-bold transition-colors duration-[750ms] ease-out ${
            active ? "text-[#ff5c54]" : "text-[#ffb4ac]"
          }`}
        >
          {inView ? `${level}%` : "0%"}
        </span>
      </div>
      <div className="h-[5px] w-full bg-[#2a2a2a] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: active
              ? "linear-gradient(90deg, #93000d, #e21b23)"
              : "#353534",
            boxShadow: active
              ? "0 0 15px rgba(226,27,35,0.5)"
              : "none",
            transition:
              "background 0.85s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.85s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

/* ── TiltCard ────────────────────────────────────── */

function TiltCard({
  title,
  bars,
  children,
  className = "",
}: {
  title: string
  bars?: SkillBar[]
  children?: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !ref.current) return
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    ref.current.style.transform = `rotateY(${-15 + nx * 10}deg) rotateX(${ny * -4}deg)`
  }

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "rotateY(-15deg)"
    setHovered(false)
  }

  return (
    <div style={{ perspective: "1000px" }}>
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`bg-[#0e0e0e] border border-[#5d3f3c]/15 p-8 md:p-12 relative overflow-hidden ease-out hover:border-[#e21b23]/28 ${className} [transition:transform_320ms_cubic-bezier(0.4,0,0.2,1),border-color_0.8s_cubic-bezier(0.4,0,0.2,1),box-shadow_0.8s_cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_0_48px_rgba(226,27,35,0.07)]`}
        style={{ transform: "rotateY(-15deg)" }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 shadow-[0_0_60px_rgba(226,27,35,0.03)] pointer-events-none mix-blend-screen" />

        {/* Card header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#5d3f3c]/20">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: hovered ? "#e21b23" : "#353534",
                boxShadow: hovered ? "0 0 10px rgba(226,27,35,0.6)" : "none",
                transition:
                  "background 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
          <h3 className="font-['Space_Grotesk'] text-xl md:text-2xl uppercase tracking-[0.15em] text-[#e5e2e1] font-bold">
            {title}
          </h3>
        </div>

        {/* Skill bars */}
        {bars && (
          <div className="space-y-8">
            {bars.map((s, i) => (
              <AnimatedBar key={s.name} {...s} delay={i * 0.1} active={hovered} />
            ))}
          </div>
        )}

        {/* Custom content (chips etc.) */}
        {children}
      </div>
    </div>
  )
}

/* ── Main section ────────────────────────────────── */

export function SkillsSection() {
  return (
    <section
      id="skills"
      className="relative py-24 sm:py-32 overflow-hidden bg-[#131313]"
    >
      {/* Grid + radial background */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(226,27,35,0.03) 0%, transparent 60%)
          `,
          backgroundSize: "40px 40px, 40px 40px, 100% 100%",
        }}
      />

      {/* Top divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e21b23]/30 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-16 relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-6"
        >
          <div>
            <p className="text-[10px] tracking-[0.3em] text-red-600 uppercase font-['Space_Grotesk'] mb-2">
              Technical Arsenal
            </p>
            <h2 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              <span className="text-[#e5e2e1]">TECHNICAL</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(45deg, #ffb4ac, #e21b23)",
                }}
              >
                ARSENAL
              </span>
            </h2>
            <div className="h-1 w-24 bg-[#e21b23] mt-6" />
          </div>
          <div className="hidden md:block w-1/3 text-right">
            <p className="text-[#e7bdb8] text-sm tracking-wide leading-relaxed">
              A curated selection of tools, languages, and frameworks.
              Precision instruments for constructing high-fidelity digital
              experiences.
            </p>
          </div>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8 md:gap-12">

          {/* Frontend — 7 cols */}
          <motion.div
            className="xl:col-span-7"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0 }}
          >
            <TiltCard title="Frontend Engineering" bars={FRONTEND} />
          </motion.div>

          {/* Backend — 5 cols */}
          <motion.div
            className="xl:col-span-5"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <TiltCard title="Backend Logic" bars={BACKEND} />
          </motion.div>

          {/* Data & Cloud — 5 cols */}
          <motion.div
            className="xl:col-span-5"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TiltCard title="Data & Cloud" bars={DATA_CLOUD} />
          </motion.div>

          {/* Languages & Architecture — 7 cols */}
          <motion.div
            className="xl:col-span-7"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <TiltCard title="Languages & Architecture">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                <div className="flex flex-col gap-3">
                  <span className="font-['Space_Grotesk'] text-[10px] tracking-[0.2em] text-[#e7bdb8] uppercase">
                    Core Languages
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {CORE_LANGUAGES.map((l) => (
                      <span
                        key={l}
                        className="px-4 py-2 rounded-full bg-[#353534] text-[#e5e2e1] font-['Space_Grotesk'] text-[10px] uppercase tracking-[0.12em] border border-[#5d3f3c]/30 hover:border-[#e21b23]/45 hover:bg-[#e21b23]/10 cursor-default transition-[border-color,background-color,color] duration-[750ms] ease-out"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="font-['Space_Grotesk'] text-[10px] tracking-[0.2em] text-[#e7bdb8] uppercase">
                    Methodologies
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {METHODOLOGIES.map((m) => (
                      <span
                        key={m}
                        className="px-4 py-2 rounded-full bg-[#353534] text-[#e5e2e1] font-['Space_Grotesk'] text-[10px] uppercase tracking-[0.12em] border border-[#5d3f3c]/30 hover:border-[#e21b23]/45 hover:bg-[#e21b23]/10 cursor-default transition-[border-color,background-color,color] duration-[750ms] ease-out"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>

        </div>
      </div>
    </section>
  )
}