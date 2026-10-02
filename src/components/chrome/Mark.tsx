/* The mark: a die with its pins, and an H routed across it as two traces and
   a bridge. The single blue via is the one live signal in the logo. */
export function Mark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" aria-hidden="true" className={className}>
      <rect x="7.5" y="7.5" width="25" height="25" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 2.5v5M20 2.5v5M28 2.5v5M12 32.5v5M20 32.5v5M28 32.5v5M2.5 12h5M2.5 20h5M2.5 28h5M32.5 12h5M32.5 20h5M32.5 28h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity=".55"
      />
      <path d="M15 13v14M25 13v14M15 20h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="25" cy="20" r="2.1" fill="var(--signal)" />
    </svg>
  )
}
