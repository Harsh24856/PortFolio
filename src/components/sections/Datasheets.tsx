import { Heading } from "@/components/ui/Heading"
import { DatasheetBook } from "./DatasheetBook"
import s from "./Datasheets.module.css"

export function Datasheets() {
  return (
    <section id="datasheets" className={`sec ${s.section}`} data-cam="3" aria-labelledby="ds-h">
      <header className={s.head} data-reveal>
        <Heading id="ds-h" lines={["Datasheets."]} />
        <p className="body on-scene" data-reveal-fade>
          Each project documented like a part: what it does, what it runs on and how it is wired. Rest on a page corner
          to turn it, and drag the loupe over a screen to see the architecture underneath.
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
