type Props = {
  clipD: string
  revealSrc: string
  stroke?: string
  strokeWidth?: number
}

export function HeroRevealSvg({
  clipD,
  revealSrc,
  stroke = "rgba(220,38,38,0.55)",
  strokeWidth = 1.5,
}: Props) {
  return (
    <svg
      className="absolute inset-0 w-full h-full z-[2] pointer-events-none"
    >
      <defs>
        <clipPath id="blobClip">
          <path d={clipD} />
        </clipPath>
      </defs>

      <image
        href={revealSrc}
        x="0"
        y="0"
        width="100%"
        height="100%"
        clipPath="url(#blobClip)"
        preserveAspectRatio="xMidYMid slice"
      />

      <path d={clipD} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  )
}
