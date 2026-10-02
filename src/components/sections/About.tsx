import { layers, specs } from "@/content/profile"
import { Heading } from "@/components/ui/Heading"
import { AssemblyPin } from "./AssemblyPin"
import s from "./About.module.css"

/* Assembly: the board comes apart into its five layers as the reader
   scrolls, and each layer stands for one layer of how I build. */
export function About() {
  return (
    <AssemblyPin>
      <div className={s.copy} data-reveal>
        <p className="eyebrow on-scene" data-reveal-fade>
          <span>01</span> Assembly
        </p>
        <Heading id="about-h" lines={["Five layers,", "each one load-bearing."]} />
        <p className="body on-scene" data-reveal-fade>
          I&apos;m a software engineer studying Computer Science at Punjab Engineering College, Chandigarh, and since
          2024 I&apos;ve freelanced for early-stage startups across healthtech, SaaS and analytics. I build a product
          the way this board goes together: from the tray up, every layer seated before the next.
        </p>
        <ol className={s.layers} data-reveal-fade data-layers>
          {layers.map((l, i) => (
            <li key={l.part} data-layer={i}>
              <span className={`${s.n} num`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.lt}>
                <b>
                  {l.part}
                  <span className={s.role}>{l.role}</span>
                </b>
                <span className={s.note}>{l.note}</span>
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
    </AssemblyPin>
  )
}
