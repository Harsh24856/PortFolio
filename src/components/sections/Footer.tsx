import { chapters, profile } from "@/content/profile"
import { Mark } from "@/components/chrome/Mark"
import s from "./Footer.module.css"

export function Footer({ home = true }: { home?: boolean }) {
  const href = (id: string) => (home ? `#${id}` : `/#${id}`)
  return (
    <footer className={`${s.foot} ${home ? "" : s.compact}`} data-cam={home ? "6" : undefined}>
      <div className={s.grid}>
        <div className={s.brand}>
          <Mark size={34} />
          <p>
            {profile.role}, based in {profile.location}.
          </p>
        </div>
        <div>
          <h2 className={s.h}>Sections</h2>
          <ul>
            {chapters.map((c) => (
              <li key={c.id}>
                <a href={href(c.id)} data-cursor>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={s.h}>Elsewhere</h2>
          <ul>
            <li>
              <a href={profile.github.href} target="_blank" rel="noopener noreferrer" data-cursor>
                GitHub<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a href={profile.linkedin.href} target="_blank" rel="noopener noreferrer" data-cursor>
                LinkedIn<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className={s.h}>Reach</h2>
          <ul>
            <li>
              <a href={`mailto:${profile.email}`} data-cursor>
                {profile.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className={s.base}>
        <span>© 2026 {profile.name}</span>
        <a href={home ? "#top" : "/"} data-cursor>
          {home ? "Back to top" : "Back to the portfolio"}
        </a>
      </div>
    </footer>
  )
}
