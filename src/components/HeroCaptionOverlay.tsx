type Props = {
  visible: boolean
  kicker: string
  name: string
  subtitle: string
}

export function HeroCaptionOverlay({
  visible,
  kicker,
  name,
  subtitle,
}: Props) {
  return (
    <div
      className={`
          absolute bottom-0 left-0 right-0 z-[3] p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 sm:pb-8
          bg-gradient-to-t from-[#030303] via-[#030303]/85 to-transparent
          transition-all duration-500
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
    >
      <p className="text-red-500 text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-2 font-semibold">
        {kicker}
      </p>
      <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2">
        {name}
      </h2>
      <p className="text-white/55 text-xs sm:text-sm tracking-wide max-w-prose">
        {subtitle}
      </p>
    </div>
  )
}
