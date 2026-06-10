// components/ContactSection.tsx
"use client"

import emailjs from "@emailjs/browser"
import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { useFineHover } from "@/components/useFineHover"

const SOCIALS = [
  {
    label: "Primary Channel",
    sublabel: "Email",
    href: "mailto:harshsehra1@gmail.com",
    value: "harshsehra1@gmail.com",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    accent: true,
  },
  {
    label: "Voice Comms",
    sublabel: "Phone",
    href: "tel:+919682124943",
    value: "+91 9682124943",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    accent: false,
  },
  {
    label: "GitHub",
    sublabel: "Code Repository",
    href: "https://github.com/Harsh24856",
    value: "github.com/harshsehra",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
    accent: false,
  },
  {
    label: "LinkedIn",
    sublabel: "Professional Network",
    href: "https://www.linkedin.com/in/harsh-sehra-223a81346/",
    value: "linkedin.com/in/harshsehra",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    accent: false,
  },
]

/* ── Perspective form card ── */
const PERSPECTIVE_IDLE = "perspective(1000px) rotateY(-5deg)"
const PERSPECTIVE_FLAT = "perspective(1000px) rotateY(0deg) rotateX(0deg)"

function PerspectiveCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const fineHover = useFineHover()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = fineHover ? PERSPECTIVE_IDLE : PERSPECTIVE_FLAT
  }, [fineHover])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!fineHover) return
    const r = ref.current?.getBoundingClientRect()
    if (!r || !ref.current) return
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    ref.current.style.transform = `perspective(1000px) rotateY(${nx * 4}deg) rotateX(${ny * -3}deg)`
  }

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = fineHover ? PERSPECTIVE_IDLE : PERSPECTIVE_FLAT
  }

  return (
    <div style={{ perspective: fineHover ? "1000px" : undefined }}>
      <div
        ref={ref}
        onMouseMove={fineHover ? handleMouseMove : undefined}
        onMouseLeave={fineHover ? handleMouseLeave : undefined}
        style={{
          transform: fineHover ? PERSPECTIVE_IDLE : PERSPECTIVE_FLAT,
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="relative overflow-hidden rounded-xl bg-[#353534]/40 backdrop-blur-xl border border-[#5d3f3c]/15 p-6 sm:p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-full"
      >
        {/* HUD top-right indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-[#e21b23] animate-pulse" />
          <span className="font-['Space_Grotesk'] text-[9px] tracking-widest text-[#e5e2e1] uppercase">
            Secure_Link_Active
          </span>
        </div>

        {/* Decorative fingerprint watermark */}
        <div className="absolute bottom-4 right-4 opacity-5 select-none pointer-events-none">
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.26.14.35.43.22.69-.09.18-.27.26-.45.26zm4.28 2.16c-.1 0-.2-.03-.29-.09-2.35-1.56-5.17-2.38-8.04-2.38-1.57 0-3.08.24-4.52.72-.27.09-.56-.06-.65-.33-.09-.27.06-.56.33-.65C10.61 3.9 12.27 3.63 14 3.63c3.15 0 6.11.87 8.61 2.55.23.15.29.46.14.69-.09.15-.26.26-.46.26zM12 23c-1.78 0-3.35-.7-4.52-1.86l-.03-.03-.04-.04C5.96 19.65 5 17.8 5 15.77c0-4.28 3.14-7 7-7s7 2.72 7 7c0 .55-.45 1-1 1s-1-.45-1-1c0-3.18-2.24-5-5-5s-5 1.82-5 5c0 1.47.67 2.84 1.84 3.91l.03.03C10.34 21.01 11.12 21 12 21c.34 0 .67-.03 1-.08.55-.09 1.06.28 1.15.83.09.55-.28 1.06-.83 1.15-.43.07-.87.1-1.32.1z" />
          </svg>
        </div>

        {children}
      </div>
    </div>
  )
}

/* ── Main export ── */
export function ContactSection() {
  const [formState, setFormState] = useState({ name: "", email: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          name: formState.name,
          email: formState.email,
          message: formState.message,
          time: new Date().toLocaleString(),
          title: "Portfolio Contact",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )
      setSubmitted(true)
      setFormState({ name: "", email: "", message: "" })
      setTimeout(() => setSubmitted(false), 3000)
    } catch {
      // submission failed — form state preserved for retry
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="relative py-16 sm:py-24 md:py-32 overflow-x-hidden overflow-y-visible bg-[#131313] max-w-[100vw]">

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#e21b23]/30 to-transparent" />

      {/* Ambient radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#e21b23]/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#e21b23]/4 blur-[100px]" />
      </div>

      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-16 relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20 w-full md:w-2/3"
        >
          <p className="font-['Space_Grotesk'] text-[10px] tracking-[0.3em] text-[#e21b23] uppercase mb-3">
            Get In Touch
          </p>
          <h2 className="font-['Space_Grotesk'] text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight text-[#e5e2e1]">
            Initiate <br />
            <span className="text-[#353534] line-through opacity-50">Connection</span>{" "}
            <span className="text-[#e21b23]">Contact.</span>
          </h2>
          <p className="font-['Inter'] text-[#e7bdb8]/60 text-base md:text-lg mt-6 max-w-md leading-relaxed">
            Secure channel open. Awaiting data packets for collaboration,
            inquiries, or network expansion.
          </p>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">

          {/* ── Form — 7 cols ── */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PerspectiveCard>
              <form onSubmit={handleSubmit} className="flex flex-col gap-9 relative z-10">

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-name"
                    className="font-['Space_Grotesk'] text-xs tracking-wide text-[#e7bdb8]"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    required
                    className="bg-transparent border-0 border-b-2 border-[#5d3f3c] text-[#e5e2e1] font-['Inter'] text-base py-3 w-full placeholder:text-[#e7bdb8]/30 focus:outline-none focus:border-[#ffb4ac] transition-colors duration-300"
                    style={{ boxShadow: "none" }}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-email"
                    className="font-['Space_Grotesk'] text-xs tracking-wide text-[#e7bdb8]"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    required
                    className="bg-transparent border-0 border-b-2 border-[#5d3f3c] text-[#e5e2e1] font-['Inter'] text-base py-3 w-full placeholder:text-[#e7bdb8]/30 focus:outline-none focus:border-[#ffb4ac] transition-colors duration-300"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-message"
                    className="font-['Space_Grotesk'] text-xs tracking-wide text-[#e7bdb8]"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Write your message..."
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    required
                    className="bg-transparent border-0 border-b-2 border-[#5d3f3c] text-[#e5e2e1] font-['Inter'] text-base py-3 w-full placeholder:text-[#e7bdb8]/30 focus:outline-none focus:border-[#ffb4ac] transition-colors duration-300 resize-none min-h-[120px]"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-3 min-h-12 px-8 py-4 font-['Space_Grotesk'] font-bold text-sm tracking-[0.15em] uppercase text-white rounded-sm w-full md:w-auto transition-all duration-300 touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #ffb4ac 0%, #e21b23 100%)",
                      boxShadow: submitted
                        ? "0 0 30px 5px rgba(226,27,35,0.5)"
                        : "0 0 20px rgba(226,27,35,0.3)",
                    }}
                  >
                    {submitted ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Transmitted
                      </>
                    ) : submitting ? (
                      <span>Transmitting…</span>
                    ) : (
                      <>
                        <span>Transmit</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </PerspectiveCard>
          </motion.div>

          {/* ── Right sidebar — 5 cols ── */}
          <motion.div
            className="lg:col-span-5 flex flex-col gap-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {SOCIALS.map((s, i) => (
              <motion.a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="group flex items-center gap-4 p-5 rounded-lg bg-[#353534]/40 backdrop-blur-xl border border-[#5d3f3c]/15 hover:bg-[#353534]/60 transition-all duration-300"
                style={{
                  borderLeft: s.accent ? "4px solid #e21b23" : undefined,
                }}
              >
                <span className="text-[#e21b23] group-hover:scale-110 transition-transform duration-300 shrink-0">
                  {s.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Space_Grotesk'] text-[9px] tracking-[0.25em] text-[#e7bdb8]/50 uppercase mb-0.5">
                    {s.label}
                  </span>
                  <span className="font-['Space_Grotesk'] text-sm md:text-base text-[#e5e2e1] group-hover:text-[#ffb4ac] transition-colors duration-300 truncate">
                    {s.value}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-[#5d3f3c] group-hover:text-[#e21b23] ml-auto shrink-0 transition-colors duration-300"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.a>
            ))}
          </motion.div>

        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-['Space_Grotesk'] text-[9px] tracking-widest text-[#e5e2e1]/30 uppercase">
            © {new Date().getFullYear()} Harsh Sehra
          </p>
          <div className="flex gap-6 font-['Space_Grotesk'] text-[9px] tracking-widest">
          </div>
        </div>

      </div>
    </section>
  )
}