import { Heading } from "@/components/ui/Heading"
import { LayoutPin } from "./LayoutPin"
import s from "./Toolkit.module.css"

/* Toolkit: the board seen from above. Each group of tools is wired to a
   cluster of keys; choosing a group, or scrolling through the chapter,
   lights those keys and prints the tools' names on them. */
export function Toolkit() {
  return (
    <LayoutPin
      head={
        <div className={s.head} data-reveal>
          <p className="eyebrow on-scene" data-reveal-fade>
            <span>02</span> Toolkit
          </p>
          <Heading id="tools-h" lines={["The tools", "I reach for."]} />
          <p className="body on-scene" data-reveal-fade>
            Everything I build with, grouped by where it sits in the stack. Choose a group, or keep scrolling, and its
            tools light up on the board below.
          </p>
        </div>
      }
    />
  )
}
