/* The mark: a keycap seen from above, its footprint and the smaller dished
   top drawn in, with an H for a legend. The blue dot is the board's one
   indicator light. */
export function Mark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" aria-hidden="true" className={className}>
      <rect x="3.5" y="3.5" width="33" height="33" rx="7" stroke="currentColor" strokeWidth="1.4" opacity=".55" />
      <rect x="9" y="7.5" width="22" height="21" rx="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M15.5 12.5v11M24.5 12.5v11M15.5 18h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="29.5" cy="32" r="1.7" fill="var(--signal)" />
    </svg>
  )
}
