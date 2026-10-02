import { projects } from "@/content/projects"
import { Heading } from "@/components/ui/Heading"
import { ClothCard } from "./ClothCard"
import s from "./Work.module.css"

export function Work() {
  return (
    <section id="work" className={`sec ${s.work}`} data-cam="3" aria-labelledby="work-h">
      <header className={s.head} data-reveal>
        <div>
          <p className="eyebrow on-scene" data-reveal-fade>
            <span>03</span> Work
          </p>
          <Heading id="work-h" lines={["Selected work."]} />
        </div>
        <p className="body on-scene" data-reveal-fade>
          Four products, each built end to end. Rest the pointer on one to stir the fabric; open it for how it was
          built.
        </p>
      </header>
      <div className={s.cards}>
        {projects.map((p, i) => (
          <ClothCard key={p.slug} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
