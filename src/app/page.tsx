import { SceneCanvas } from "@/components/scene/SceneCanvas"
import { Preloader } from "@/components/chrome/Preloader"
import { Nav } from "@/components/chrome/Nav"
import { ChapterRail } from "@/components/chrome/ChapterRail"
import { Reticle } from "@/components/chrome/Reticle"
import { MotionRoot } from "@/components/chrome/MotionRoot"
import { MotionToggle } from "@/components/chrome/MotionToggle"
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
      <noscript>
        <style>{`#pre{display:none!important}html.is-loading,html.is-loading body{overflow:auto!important}`}</style>
      </noscript>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <SceneCanvas />
      <Preloader />
      <Nav />
      <ChapterRail />
      <Reticle />
      <MotionToggle />
      <MotionRoot />
      <div className="page" id="top">
        <main>
          <Hero />
          <About />
          <Toolkit />
          <Work />
          <Datasheets />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  )
}
