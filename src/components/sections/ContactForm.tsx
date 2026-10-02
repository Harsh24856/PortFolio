"use client"

import { useRef, useState } from "react"
import { profile } from "@/content/profile"
import { emit } from "@/lib/bus"
import s from "./Contact.module.css"

type Field = "name" | "email" | "message"
type Errors = Partial<Record<Field, string>>

const EMAILJS = {
  service: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  template: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  key: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
}
const configured = !!(EMAILJS.service && EMAILJS.template && EMAILJS.key)

function check(field: Field, v: string): string {
  const t = v.trim()
  if (field === "name") return t ? "" : "Enter your name."
  if (field === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? "" : "Enter an email address like name@company.com."
  return t.length >= 10 ? "" : "Write at least a sentence about what you are building."
}

/* Sends through EmailJS when it is configured and opens the visitor's mail
   app when it is not. Nothing typed is lost on failure. */
export function ContactForm() {
  const form = useRef<HTMLFormElement>(null)
  const sentRef = useRef<HTMLDivElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "mailto">("idle")

  const value = (f: Field) => (form.current?.elements.namedItem(f) as HTMLInputElement | null)?.value ?? ""

  const onBlur = (f: Field) => {
    if (!value(f)) return
    setErrors((e) => ({ ...e, [f]: check(f, value(f)) }))
  }
  const onInput = (f: Field) => {
    if (errors[f] && !check(f, value(f))) setErrors((e) => ({ ...e, [f]: "" }))
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const el = form.current!
    if ((el.elements.namedItem("company") as HTMLInputElement).value) return
    const next: Errors = {}
    ;(["name", "email", "message"] as Field[]).forEach((f) => (next[f] = check(f, value(f))))
    setErrors(next)
    const bad = (["name", "email", "message"] as Field[]).find((f) => next[f])
    if (bad) {
      ;(el.elements.namedItem(bad) as HTMLElement).focus()
      return
    }
    const data = { name: value("name").trim(), email: value("email").trim(), message: value("message").trim() }

    if (!configured) {
      const body = `${data.message}\n\n${data.name}\n${data.email}`
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
        `Portfolio message from ${data.name}`,
      )}&body=${encodeURIComponent(body)}`
      setState("mailto")
      return
    }

    setState("sending")
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.service,
          template_id: EMAILJS.template,
          user_id: EMAILJS.key,
          template_params: { ...data, time: new Date().toLocaleString(), title: "Portfolio Contact" },
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      el.reset()
      setState("sent")
      emit("scene:pulse", {})
      requestAnimationFrame(() => sentRef.current?.focus())
    } catch {
      setState("failed")
    }
  }

  if (state === "sent") {
    return (
      <div ref={sentRef} className={s.sent} tabIndex={-1}>
        <span className="live" aria-hidden="true" />
        <h3 className="h3">Message sent.</h3>
        <p className="body">Thank you. I&apos;ll reply to your email soon.</p>
        <button type="button" className="btn" onClick={() => setState("idle")} data-cursor>
          Write another message
        </button>
      </div>
    )
  }

  const field = (f: Field, label: string, input: React.ReactNode) => (
    <div className={s.field} data-invalid={errors[f] ? "" : undefined}>
      <label htmlFor={`f-${f}`}>{label}</label>
      {input}
      <p className={s.err} id={`e-${f}`} hidden={!errors[f]}>
        {errors[f]}
      </p>
    </div>
  )

  return (
    <form ref={form} className={s.form} noValidate onSubmit={onSubmit}>
      {field(
        "name",
        "Name",
        <input
          id="f-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={!!errors.name}
          aria-describedby="e-name"
          onBlur={() => onBlur("name")}
          onInput={() => onInput("name")}
        />,
      )}
      {field(
        "email",
        "Email",
        <input
          id="f-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          placeholder="name@company.com"
          required
          aria-invalid={!!errors.email}
          aria-describedby="e-email"
          onBlur={() => onBlur("email")}
          onInput={() => onInput("email")}
        />,
      )}
      {field(
        "message",
        "What are you building?",
        <textarea
          id="f-message"
          name="message"
          rows={5}
          maxLength={2000}
          required
          aria-invalid={!!errors.message}
          aria-describedby="e-message"
          onBlur={() => onBlur("message")}
          onInput={() => onInput("message")}
        />,
      )}
      <input className={s.hp} name="company" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={s.foot}>
        <button className="btn btn--solid" type="submit" disabled={state === "sending"} aria-busy={state === "sending"} data-cursor>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className={s.status} role="status" aria-live="polite">
          {state === "failed" && (
            <>
              The message didn&apos;t send. Try again, or email <a href={`mailto:${profile.email}`}>{profile.email}</a>.
            </>
          )}
          {state === "mailto" && <>Opening your mail app. If nothing opens, email {profile.email} directly.</>}
        </p>
      </div>
    </form>
  )
}
