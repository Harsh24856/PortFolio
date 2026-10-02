import { HeroChips, HeroExit, LocalTime } from "./HeroClient"
import s from "./Hero.module.css"

export function Hero() {
  return (
    <section id="hero" className={s.hero} data-cam="0" aria-labelledby="hero-h">
      <div className={s.top} data-reveal data-hero-top>
        <h1 id="hero-h" className="display h1 on-scene">
          <span className="sr-only">Harsh Sehra. </span>
          <span className="mask-line">
            <span style={{ "--i": 0 } as React.CSSProperties}>Full-stack and applied AI</span>
          </span>
          <span className="mask-line">
            <span style={{ "--i": 1 } as React.CSSProperties}>engineering, shipped</span>
          </span>
          <span className="mask-line">
            <span style={{ "--i": 2 } as React.CSSProperties}>end to end.</span>
          </span>
        </h1>
        <p className={`lead on-scene ${s.sub}`} data-reveal-fade>
          I build web and mobile products for early-stage startups: the interface, the API, the database and the models
          on top.
        </p>
        <div className={s.ctas} data-reveal-fade>
          <a className="btn btn--solid" href="#work" data-cursor>
            See the work
          </a>
          <a className="btn" href="#contact" data-cursor>
            Get in touch
          </a>
        </div>
      </div>

      <div className={s.spacer} />

      <div className={s.foot} data-reveal>
        <HeroChips />
        <p className={`${s.readout} mono on-scene`} data-reveal-fade data-hero-readout>
          <span className="live" aria-hidden="true" />
          <span>Chandigarh, India</span>
          <span className={s.coord}>30.73° N 76.78° E</span>
          <LocalTime />
        </p>
      </div>

      <p className={s.wordFallback} aria-hidden="true">
        HARSH
      </p>
      <HeroExit />
    </section>
  )
}
