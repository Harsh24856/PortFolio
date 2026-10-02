import { Heading } from "@/components/ui/Heading"
import { alsoFluent } from "@/content/toolkit"
import { LayoutPin } from "./LayoutPin"
import s from "./Toolkit.module.css"

/* Layout: the board seen from above. Each group of tools is wired to a
   cluster of keys; choosing a group, or scrolling through the chapter,
   lights those keys and prints the tools' names on them. */
export function Toolkit() {
  return (
    <LayoutPin
      head={
        <div className={s.head} data-reveal>
          <p className="eyebrow on-scene" data-reveal-fade>
            <span>02</span> Layout
          </p>
          <Heading id="tools-h" lines={["Sixty-eight keys,", "every tool I reach for."]} />
          <p className="body on-scene" data-reveal-fade>
            Nothing missing, nothing for show. Choose a group, or keep scrolling, and its keys light on the board below
            with the tools they stand for.
          </p>
        </div>
      }
      foot={
        <p className={`${s.also} on-scene`}>
          <span className="tag">Also fluent</span> {alsoFluent.join(", ")}
        </p>
      }
    />
  )
}
