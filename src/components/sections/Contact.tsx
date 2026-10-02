import { profile } from "@/content/profile"
import { Heading } from "@/components/ui/Heading"
import { ContactForm } from "./ContactForm"
import s from "./Contact.module.css"

export function Contact() {
  return (
    <section id="contact" className={`sec ${s.section}`} data-cam="5" aria-labelledby="contact-h">
      <div className={s.copy} data-reveal>
        <p className="eyebrow on-scene" data-reveal-fade>
          <span>05</span> Contact
        </p>
        <Heading id="contact-h" lines={["Let’s build", "something."]} />
        <p className="lead on-scene" data-reveal-fade>
          Have a product, a role or an idea that needs building? Send a note or reach me directly. Every key you press here, the board presses too.
        </p>
        <ul className={s.reach} data-reveal-fade>
          <li>
            <a href={`mailto:${profile.email}`} data-cursor>
              <span>Email</span>
              <b>{profile.email}</b>
            </a>
          </li>
          <li>
            <a href={profile.github.href} target="_blank" rel="noopener noreferrer" data-cursor>
              <span>GitHub</span>
              <b>
                {profile.github.handle}
                <span className="sr-only"> (opens in a new tab)</span>
              </b>
            </a>
          </li>
          <li>
            <a href={profile.linkedin.href} target="_blank" rel="noopener noreferrer" data-cursor>
              <span>LinkedIn</span>
              <b>
                {profile.linkedin.handle}
                <span className="sr-only"> (opens in a new tab)</span>
              </b>
            </a>
          </li>
        </ul>
      </div>
      <div className={s.panel} data-reveal>
        <div data-reveal-fade>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
