"use client"

import { useChapter } from "@/lib/chapter"
import s from "./Foreground.module.css"

/* The template's chapter foregrounds, reinterpreted: instead of walls, pines
   and grass, each chapter is framed by out-of-focus package hardware close
   to the lens (bond wires, leads, fins, a ribbon bus, the wafer's edge).
   They slide in from the frame edge as their chapter takes over and leave
   as the next arrives. Purely decorative. */

const wireGrad = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#c9d3e6" />
    <stop offset=".45" stopColor="#5d6573" />
    <stop offset="1" stopColor="#14171c" />
  </linearGradient>
)

function BondWires({ flip = false, uid }: { flip?: boolean; uid: string }) {
  const wires = [
    "M-20 640 C 80 300, 260 260, 360 640",
    "M-40 660 C 70 230, 330 200, 430 660",
    "M10 680 C 120 360, 230 340, 300 680",
    "M-60 700 C 40 160, 400 140, 500 700",
  ]
  return (
    <svg viewBox="0 0 520 700" className={s.svg} style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <defs>{wireGrad(`fg-wire-${uid}`)}</defs>
      {wires.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={`url(#fg-wire-${uid})`} strokeWidth={9 - i} fill="none" strokeLinecap="round" opacity={0.95} />
          <path d={d} stroke="#9fbbff" strokeWidth={1} fill="none" opacity={0.35} />
        </g>
      ))}
      <rect x="-40" y="640" width="600" height="80" fill="#050608" />
    </svg>
  )
}

function Leads() {
  return (
    <svg viewBox="0 0 600 260" className={s.svg}>
      <defs>
        <linearGradient id="fg-lead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#aeb8c8" />
          <stop offset="1" stopColor="#1a1d22" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="600" height="96" rx="10" fill="#07080a" stroke="#2a2f38" />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M${30 + i * 52} 96 v70 q0 24 24 24 h14`}
          stroke="url(#fg-lead)"
          strokeWidth="16"
          fill="none"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

function Fins() {
  return (
    <svg viewBox="0 0 420 600" className={s.svg}>
      <defs>
        <linearGradient id="fg-fin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b1f26" />
          <stop offset=".5" stopColor="#6e7a8e" />
          <stop offset="1" stopColor="#0b0d10" />
        </linearGradient>
      </defs>
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={i * 60} y={60 + (i % 2) * 30} width="30" height="600" fill="url(#fg-fin)" />
      ))}
    </svg>
  )
}

function Ribbon() {
  return (
    <svg viewBox="0 0 1200 220" className={s.svg} preserveAspectRatio="none">
      {Array.from({ length: 14 }, (_, i) => (
        <path
          key={i}
          d={`M-20 ${150 + i * 6} C 300 ${70 + i * 6}, 700 ${210 + i * 4}, 1220 ${110 + i * 6}`}
          stroke={i % 4 === 0 ? "#7aa7ff" : "#3a414d"}
          strokeOpacity={i % 4 === 0 ? 0.55 : 0.9}
          strokeWidth="3"
          fill="none"
        />
      ))}
    </svg>
  )
}

function WaferEdge() {
  return (
    <svg viewBox="0 0 500 900" className={s.svg}>
      <defs>
        <radialGradient id="fg-wafer" cx="1.1" cy=".5" r="1">
          <stop offset=".72" stopColor="#0d1016" />
          <stop offset=".93" stopColor="#3b4a6b" />
          <stop offset="1" stopColor="#9fbbff" />
        </radialGradient>
      </defs>
      <circle cx="900" cy="450" r="820" fill="url(#fg-wafer)" />
    </svg>
  )
}

const STAGES: Record<string, { el: React.ReactNode; place: string; from: "left" | "right" | "up" | "down" }[]> = {
  about: [
    { el: <BondWires uid="a" />, place: s.bl, from: "left" },
    { el: <Leads />, place: s.brLow, from: "up" },
  ],
  work: [{ el: <Fins />, place: s.trTall, from: "right" }],
  datasheets: [
    { el: <BondWires flip uid="d" />, place: s.br, from: "right" },
  ],
  toolkit: [{ el: <Ribbon />, place: s.bottom, from: "up" }],
  contact: [
    { el: <WaferEdge />, place: s.rEdge, from: "right" },
    { el: <BondWires uid="c" />, place: s.bl, from: "left" },
  ],
}

export function Foreground() {
  const { id } = useChapter()
  return (
    <div className={s.layer} aria-hidden="true">
      {Object.entries(STAGES).map(([key, parts]) => (
        <div key={key} className={s.stage} data-active={id === key || undefined}>
          {parts.map((p, i) => (
            <div key={i} className={`${s.piece} ${p.place}`} data-from={p.from} style={{ transitionDelay: `${i * 0.12}s` }}>
              {p.el}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
