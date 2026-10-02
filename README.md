# Harsh Sehra | portfolio

A night walk across a silicon die. The scroll moves a camera over the chip at architectural scale: in over the bond wires, up the avenue between the memory banks, up the metal stack, through a row of transistor gates and onto the plateau before the core, with a wafer hanging in the sky. Chapters: hero, About, Work, Datasheets, Toolkit, Contact, and a top-down die shot in the footer.

Black, white and a little blue. Blue is light, never fill: it marks what is live.

## How it is put together

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | The home page: server-rendered sections over the scene |
| `src/app/work/[slug]/` | Case studies, statically generated from `src/content/projects.ts` |
| `src/content/` | The single source of truth: profile, projects (with architecture graphs), toolkit matrix |
| `src/components/sections/` | Hero, About, Work (cloth cards), Datasheets (page-turning book with an X-ray loupe), Toolkit (connection matrix), Contact, Footer |
| `src/components/chrome/` | Nav, chapter rail, preloader, CAD reticle cursor, chapter foregrounds, motion toggle |
| `src/engine/` | The WebGL die world, plain TypeScript with no React: renderer, floorplan generator, world builders, wordmark, packets, camera rig, post-processing, cloth |
| `src/lib/bus.ts` | The only link between the page and the engine: typed window events |
| `public/shots/` | Project screenshots |

The engine is a separate chunk loaded after first paint. If WebGL is missing, the device is weak, or a build step throws, a CSS poster stays and the page works the same.

## Tiers

| Tier | Who | What |
|------|-----|------|
| high | Desktop with a fine pointer | Full scene, shadows, bloom chain |
| mid | Touch devices, narrow screens | Scene without post-processing or shadows |
| low | No WebGL2, low memory, Save-Data | Static poster |

Force one with `?tier=high|mid|low`. `?shot=N` jumps to chapter N with the intro finished (for screenshots). `?perf` logs build-step timings.

## Motion and accessibility

- `prefers-reduced-motion`: the camera cuts between chapters instead of flying, ambient motion stops, reveals are instant.
- A "Pause background motion" control (under the chapter rail, or in the menu on phones) stops the scene, the cloth and the diagram packets, and is remembered.
- Every hover interaction has a keyboard equivalent. Checked with axe-core and a keyboard walk; WCAG 2.1 AA.

## Design system

Archivo (variable width) for display and text, B612 Mono for data. Tokens live in `src/app/globals.css`:

| Token | Value | Role |
|-------|-------|------|
| `--void` | `#000000` | Page and scene black |
| `--white` | `#F4F5F7` | Primary text |
| `--silver` | `#A9AFB8` | Body text |
| `--steel` | `#777D87` | Metadata |
| `--signal` | `#7AA7FF` | Live states, focus |
| `--signal-deep` | `#2F5BFF` | Selection |

## Contact form

Posts straight to EmailJS from the browser. Set these in `.env.local` (and in the host's environment before building):

```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_SITE_URL=https://your-domain
```

Without the EmailJS ids, the form opens the visitor's mail app instead. `NEXT_PUBLIC_SITE_URL` is used for metadata and the sitemap.

## Scripts

```bash
npm run dev    # development, http://localhost:4000
npm run build  # production build
npm run start  # run production server
npm run lint   # eslint
```

## Stack

Next.js 16, React 19, TypeScript, three.js, GSAP (loaded on demand).
