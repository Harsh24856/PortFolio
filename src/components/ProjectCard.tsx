"use client"

import { motion } from "framer-motion"

type Props = {
  title: string
  tagline: string
  stack: string[]
  bullets: string[]
  liveUrl?: string
  repoUrl?: string
  index: number
}

export function ProjectCard({
  title,
  tagline,
  stack,
  bullets,
  liveUrl,
  repoUrl,
  index,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 sm:p-8 flex flex-col h-full group"
      id={`project-card-${index}`}
    >
      {/* number accent */}
      <span className="text-red-500/30 text-6xl font-black leading-none -mt-2 mb-3 select-none">
        0{index + 1}
      </span>

      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
        {title}
      </h3>
      <p className="text-white/50 text-sm mb-4 leading-relaxed">{tagline}</p>

      {/* stack badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {stack.map((s) => (
          <span key={s} className="tech-badge">
            {s}
          </span>
        ))}
      </div>

      {/* bullets */}
      <ul className="flex-1 space-y-2 mb-6">
        {bullets.map((b, i) => (
          <li key={i} className="text-white/60 text-sm leading-relaxed flex gap-2">
            <span className="text-red-500 mt-1 shrink-0">▸</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* links */}
      <div className="flex gap-3 mt-auto">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Live
          </a>
        )}
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-white/15 hover:border-white/30 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Code
          </a>
        )}
      </div>
    </motion.div>
  )
}
