# Die at night: portfolio redesign

Approved 2026-10-02. Evolves the scroll-driven WebGL "night temple" template into a software, AI and engineering portfolio.

## Intent

A premium, technical portfolio for Harsh Sehra (full-stack, mobile and applied ML engineer). Keep the template's DNA: one continuous 3D world walked by scroll, the giant 3D wordmark, cloth project cards, chapter foregrounds, a preloader that narrates the build, cinematic post-processing. Replace the temple with a silicon die at architectural scale, at night.

Palette is fixed by the client: black, white, a little blue. Fully technical.

## World mapping

| Temple | Die |
|---|---|
| Blood moon | Wafer in the sky, thin-film blue sheen, die grid |
| Torii over the stairs | Transistor gate straddling fins |
| Stone stairs | Metal-layer stack stepping up to the core |
| Lanterns | Test-point LEDs |
| Worship hall with lit shoji | Control core, stacked tiers, lit cache cells |
| Maples | Heatsink fin arrays |
| Falling leaves | Data packets travelling the traces |
| Cursor wisps | Cursor light that reveals the circuitry under it |
| Grass foreground | Bond wires and package pins |
| "Lighting the lanterns" | Fabrication steps |

Chapters: hero, about (core), work (memory), datasheets (gate), toolkit (I/O bus), contact (bond pads), footer (top-down die shot).

## Design system

- Colour: `--void #000000`, `--white #F4F5F7`, `--silver #A9AFB8`, `--steel #6E747E`, `--signal #7AA7FF`, `--signal-deep #2F5BFF`. Blue is light, never fill.
- Type: Archivo (variable width and weight) for display and text; B612 Mono for real data only.
- Radius scales with size: 2 / 6 / 14 px.

## Architecture

- Next.js 16 App Router. Server-rendered sections; the WebGL engine is plain TypeScript under `src/engine`, mounted by a client component after first paint.
- Content in `src/content` feeds cards, datasheets, toolkit matrix and case studies.
- `/work/[slug]` case studies, statically generated.
- GSAP for the one orchestrated load moment and scroll scrubs. No Motion.
- Tiers: high (post + bloom), mid (no post), low or no WebGL (static poster).

## Rules

- No invented metrics; facts come from the resume.
- Every hover affordance also works on focus. Reduced motion respected.
- WCAG 2.1 AA contrast on all text.
