import Link from "next/link"
import { Backdrop } from "@/components/scene/Backdrop"
import s from "./not-found.module.css"

export default function NotFound() {
  return (
    <>
      <Backdrop />
      <main className={s.lost}>
        <p className={`${s.code} num`}>404</p>
        <h1 className="display h2">No route to this address.</h1>
        <p className="body">The link may be old, or the address mistyped. Everything else is one step back.</p>
        <Link className="btn btn--solid" href="/">
          Back to the portfolio
        </Link>
      </main>
    </>
  )
}
