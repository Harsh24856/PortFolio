# Harsh Sehra | portfolio

A 65% mechanical keyboard, built entirely in code, that the page takes apart as you scroll. Every keycap is lofted procedurally (drafted walls, a filleted rim, a cylindrical dish) with its legend printed into a texture atlas. A scan plane cuts across the board: on one side the solid case, on the other a blue wireframe showing the switches and traces inside.

| # | Chapter | What the board does |
|---|---------|---------------------|
| 00 | Index | Sits at three-quarters over a giant HARSH wordmark, and types the name on arrival |
| 01 | Assembly | Pulls apart into five layers (tray, diffuser, switches, top case, keycaps), each one layer of how I build, with the separation read out in mm |
| 02 | Layout | Seen from above; each toolkit tab lights its cluster of keys and prints the tools' names on them |
| 03 | Work | A macro pass low over the caps, behind the cloth project cards |
| 04 | Datasheets | Side on, half the board opened up in x-ray |
| 05 | Contact | Every key you type, the board types too; sending the form runs a wave out from Enter |

The real keyboard drives the drawn one everywhere on the page. Black, white and a little blue. Blue is light, never fill: it marks what is live.

## How it is put together

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | The home page: server-rendered sections over the scene |
| `src/app/work/[slug]/` | Case studies, statically generated from `src/content/projects.ts` |
| `src/content/` | The single source of truth: profile, projects (with architecture graphs), toolkit matrix |
| `src/components/sections/` | Hero, Assembly (pinned, explodes the board), Layout (pinned toolkit tabs), Work (cloth cards), Datasheets (page-turning book with an X-ray loupe), Contact, Footer |
| `src/components/chrome/` | Nav with menu sheet, numbered chapter rail, preloader, reticle cursor, motion toggle |
| `src/engine/` | The WebGL keyboard, plain TypeScript with no React: board layout, keycap geometry, legend atlas, case layers and x-ray cut, hex backdrop with chapter words, camera rig, post-processing, cloth |
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
- A "Pause background motion" control (at the foot of the chapter rail, and in the menu) stops the board's float and glow, the typed greeting, the cloth and the diagram packets, and is remembered.
- The toolkit tabs are a real tablist (arrow keys, Home, End); choosing one scrolls to its step, and scrolling selects it.
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
