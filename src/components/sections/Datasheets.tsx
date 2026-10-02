import { Heading } from "@/components/ui/Heading"
import { DatasheetBook } from "./DatasheetBook"
import s from "./Datasheets.module.css"

export function Datasheets() {
  return (
    <section id="datasheets" className={`sec ${s.section}`} data-cam="4" aria-labelledby="ds-h">
      <header className={s.head} data-reveal>
        <div>
          <p className="eyebrow on-scene" data-reveal-fade>
            <span>04</span> Datasheets
          </p>
          <Heading id="ds-h" lines={["Datasheets."]} />
        </div>
        <p className="body on-scene" data-reveal-fade>
          Each project documented like a part: what it does, what it runs on and how it is wired. Rest on the right-hand
          page for a few seconds to turn it, and drag the loupe over a screen to see the architecture underneath.
        </p>
      </header>
      <div data-reveal>
        <div data-reveal-fade>
          <DatasheetBook />
        </div>
      </div>
    </section>
  )
}
