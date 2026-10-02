import { Heading } from "@/components/ui/Heading"
import { ToolMatrix } from "./ToolMatrix"
import s from "./Toolkit.module.css"

export function Toolkit() {
  return (
    <section id="toolkit" className={`sec ${s.section}`} data-cam="4" aria-labelledby="tools-h">
      <header className={s.head} data-reveal>
        <Heading id="tools-h" lines={["What it runs on."]} />
        <p className="body on-scene" data-reveal-fade>
          The stack behind each product, as a connection matrix: a via wherever a tool ran in a shipped project. Select a
          tool or a project to trace its connections.
        </p>
      </header>
      <div data-reveal>
        <div data-reveal-fade>
          <ToolMatrix />
        </div>
      </div>
    </section>
  )
}
