import { specs } from "@/content/profile"
import { Heading } from "@/components/ui/Heading"
import s from "./About.module.css"

export function About() {
  return (
    <section id="about" className={`sec ${s.about}`} data-cam="1" aria-labelledby="about-h">
      <div className={s.grid} data-reveal>
        <Heading id="about-h" lines={["From rough idea", "to shipped product."]} />
        <div className={s.copy}>
          <p className="lead on-scene" data-reveal-fade>
            I&apos;m a software engineer studying Computer Science at Punjab Engineering College, Chandigarh. Since 2024
            I&apos;ve freelanced for early-stage startups across healthtech, SaaS and analytics.
          </p>
          <p className="body on-scene" data-reveal-fade>
            I sit with founders, turn rough product ideas into APIs, interfaces and databases, and ship them. React and
            React Native up front, Node and Postgres underneath, and machine learning when the problem asks for it.
          </p>
        </div>
      </div>

      <figure className={s.specs} data-reveal>
        <figcaption className={s.caption} data-reveal-fade>
          Key specifications
        </figcaption>
        <dl className={s.table} data-reveal-fade>
          {specs.map((row) => (
            <div key={row.k} className={s.row}>
              <dt>{row.k}</dt>
              <dd className="num">
                {row.v}
                {row.unit && <small>{row.unit}</small>}
              </dd>
            </div>
          ))}
        </dl>
      </figure>
    </section>
  )
}
