import { specs, strengths } from "@/content/profile"
import { Heading } from "@/components/ui/Heading"
import { AboutPin } from "./AboutPin"
import s from "./About.module.css"

/* About: who I am, then what I am good at, one strength at a time as the
   reader scrolls. The board comes apart behind it. */
export function About() {
  return (
    <AboutPin count={strengths.length}>
      <div className={s.copy} data-reveal>
        <p className="eyebrow on-scene" data-reveal-fade>
          <span>01</span> About
        </p>
        <Heading id="about-h" lines={["Interface to", "infrastructure."]} />
        <p className="body on-scene" data-reveal-fade>
          I&apos;m Harsh, a software engineer studying Computer Science at Punjab Engineering College, Chandigarh. Since
          2024 I&apos;ve freelanced for early-stage startups across healthtech, SaaS and analytics: I sit with founders,
          turn rough ideas into interfaces, APIs and databases, and ship them.
        </p>
        <ol className={s.layers} data-reveal-fade data-layers aria-label="What I bring">
          {strengths.map((l, i) => (
            <li key={l.title}>
              <span className={`${s.n} num`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.lt}>
                <b>
                  {l.title}
                  <span className={s.role}>{l.tag}</span>
                </b>
                <span className={s.note}>
                  <span>{l.note}</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <dl className={s.specs} data-reveal-fade>
        {specs.map((row) => (
          <div key={row.k}>
            <dt className="tag">{row.k}</dt>
            <dd className="num">
              {row.v}
              {row.unit && <small>{row.unit}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </AboutPin>
  )
}
