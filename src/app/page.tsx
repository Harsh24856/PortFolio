import { bootScript } from "@/lib/boot"
import { SceneCanvas } from "@/components/scene/SceneCanvas"
import { Preloader } from "@/components/chrome/Preloader"
import { Nav } from "@/components/chrome/Nav"
import { ChapterRail } from "@/components/chrome/ChapterRail"
import { Reticle } from "@/components/chrome/Reticle"
import { Foreground } from "@/components/chrome/Foreground"
import { MotionRoot } from "@/components/chrome/MotionRoot"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Work } from "@/components/sections/Work"
import { Datasheets } from "@/components/sections/Datasheets"
import { Toolkit } from "@/components/sections/Toolkit"
import { Contact } from "@/components/sections/Contact"
import { Footer } from "@/components/sections/Footer"

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      <noscript>
        <style>{`#pre{display:none!important}html.is-loading,html.is-loading body{overflow:auto!important}`}</style>
      </noscript>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <SceneCanvas />
      <Foreground />
      <Preloader />
      <Nav />
      <ChapterRail />
      <Reticle />
      <MotionRoot />
      <div className="page" id="top">
        <main>
          <Hero />
          <About />
          <Work />
          <Datasheets />
          <Toolkit />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  )
}
