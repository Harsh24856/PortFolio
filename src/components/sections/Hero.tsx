import { HeroExit, LocalTime } from "./HeroClient"
import s from "./Hero.module.css"

export function Hero() {
  return (
    <section id="hero" className={s.hero} data-cam="0" aria-labelledby="hero-h">
      <div className={s.top} data-reveal data-hero-top>
        <p className="eyebrow on-scene" data-reveal-fade>
          <span>00</span> Index
        </p>
        <h1 id="hero-h" className="display h1 on-scene">
          <span className="sr-only">Harsh Sehra. </span>
          <span className="mask-line">
            <span style={{ "--i": 0 } as React.CSSProperties}>Software, built the way</span>
          </span>
          <span className="mask-line">
            <span style={{ "--i": 1 } as React.CSSProperties}>a good board is.</span>
          </span>
        </h1>
      </div>

      <div className={s.spacer} />

      <div className={s.foot} data-reveal>
        <p className={`${s.lead} on-scene`} data-reveal-fade data-hero-fade>
          Full-stack and applied AI engineer. I build web and mobile products for early-stage startups, from the
          database up to the last keycap.
        </p>
        <div className={s.ctas} data-reveal-fade data-hero-fade>
          <a className="btn btn--solid" href="#work" data-cursor>
            See the work
          </a>
          <a className="btn" href="#about" data-cursor>
            Take it apart
          </a>
        </div>
        <div className={`${s.readout} on-scene`} data-reveal-fade data-hero-fade>
          <p className={s.hint}>
            <span className="live" aria-hidden="true" />
            Type anything. The board types with you.
          </p>
          <p className="tag">
            Chandigarh, IN <span className={s.coord}>30.73° N 76.78° E</span> <LocalTime />
          </p>
        </div>
      </div>

      <p className={s.wordFallback} aria-hidden="true">
        HARSH
      </p>
      <HeroExit />
    </section>
  )
}
