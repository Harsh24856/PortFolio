import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ViewTransition } from "react"
import { getProject, projects } from "@/content/projects"
import { Nav } from "@/components/chrome/Nav"
import { Reticle } from "@/components/chrome/Reticle"
import { MotionToggle } from "@/components/chrome/MotionToggle"
import { Backdrop } from "@/components/scene/Backdrop"
import { ArchitectureDiagram } from "@/components/ui/ArchitectureDiagram"
import { Footer } from "@/components/sections/Footer"
import s from "./case.module.css"

export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) return {}
  return {
    title: `${p.name}, ${p.kind.toLowerCase()}`,
    description: p.summary,
    openGraph: { title: p.name, description: p.summary, images: [{ url: p.image }] },
  }
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) notFound()
  const i = projects.indexOf(p)
  const next = projects[(i + 1) % projects.length]
  const part = `HS-${p.year.slice(2)}${String(i + 1).padStart(2, "0")}`

  return (
    <>
      <a className="skip" href="#case">
        Skip to content
      </a>
      <Backdrop />
      <Nav home={false} />
      <Reticle />
      <MotionToggle />
      <div className="page">
        <main id="case" className={s.main}>
          <header className={s.head}>
            <Link href="/#work" className={s.back} data-cursor>
              Back to the work
            </Link>
            <p className={`${s.part} mono`}>
              <span>{part}</span>
              <span>
                {p.kind}, {p.year}
              </span>
            </p>
            <h1 className={`display h1 ${s.title}`}>{p.name}</h1>
            <p className={`lead ${s.summary}`}>{p.summary}</p>
            <ul className={s.links}>
              {p.links.map((l, j) => (
                <li key={l.href}>
                  <a
                    className={`btn ${j === 0 ? "btn--solid" : ""}`}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor
                  >
                    {l.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </header>

          <ViewTransition name={`plate-${p.slug}`}>
            <figure className={s.plate}>
              <Image src={p.image} alt={p.imageAlt} fill priority sizes="(max-width: 1200px) 94vw, 1180px" />
            </figure>
          </ViewTransition>

          <div className={s.body}>
            <section className={s.block} aria-labelledby="problem-h">
              <h2 id="problem-h" className={`${s.h2} mono`}>
                The problem
              </h2>
              <p className={s.prose}>{p.problem}</p>
            </section>

            <section className={s.block} aria-labelledby="built-h">
              <h2 id="built-h" className={`${s.h2} mono`}>
                What I built
              </h2>
              <ul className={s.list}>
                {p.built.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>

            <section className={`${s.block} ${s.wide}`} aria-labelledby="arch-h">
              <h2 id="arch-h" className={`${s.h2} mono`}>
                Architecture
              </h2>
              <div className={s.arch} role="region" aria-label={`${p.name} architecture diagram`} tabIndex={0}>
                <ArchitectureDiagram project={p} idPrefix={`case-${p.slug}`} />
              </div>
              <ul className={`${s.legend} mono`} aria-label="Legend">
                <li data-k="client">Client</li>
                <li data-k="service">Service</li>
                <li data-k="model">Model</li>
                <li data-k="data">Data</li>
                <li data-k="external">External service</li>
              </ul>
            </section>

            <section className={`${s.block} ${s.wide}`} aria-labelledby="dec-h">
              <h2 id="dec-h" className={`${s.h2} mono`}>
                Decisions that shaped it
              </h2>
              <ol className={s.decisions}>
                {p.decisions.map((d, k) => (
                  <li key={d.title}>
                    <span className="num" aria-hidden="true">
                      {String(k + 1).padStart(2, "0")}
                    </span>
                    <h3 className="h3">{d.title}</h3>
                    <p>{d.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={s.block} aria-labelledby="out-h">
              <h2 id="out-h" className={`${s.h2} mono`}>
                Outcome
              </h2>
              <p className={s.prose}>{p.outcome}</p>
            </section>

            <section className={s.block} aria-labelledby="stack-h">
              <h2 id="stack-h" className={`${s.h2} mono`}>
                Stack
              </h2>
              <ul className={s.stack}>
                {p.stack.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          </div>

          <nav className={s.next} aria-label="Next project">
            <Link href={`/work/${next.slug}`} data-cursor>
              <span className="mono">Next part</span>
              <b className="display">{next.name}</b>
              <span>{next.summary}</span>
            </Link>
          </nav>
        </main>
        <Footer home={false} />
      </div>
    </>
  )
}
