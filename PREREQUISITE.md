# Prerequisites

Environment and assets you need before running or extending this site.

## Runtime

- **Node.js** 20 LTS or newer (matches Next.js 16 expectations)
- **npm** (ships with Node) — or use `pnpm` / `yarn` if you prefer

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required assets (Spider-Man hero)

Place these files under **`public/images/`**:

| File   | Role |
|--------|------|
| `11.png` | Base / “Peter” layer (full-bleed photo) |
| `12.png` | Reveal / mask layer (Spider-Man or suit artwork), same aspect ratio as base if possible |

Paths are wired in `src/components/HeroScene.tsx` (`BASE_SRC`, `REVEAL_SRC`). Change filenames there if you use different names.

## Optional links to add later

The resume lists GitHub and LinkedIn without URLs in the exported PDF. When you have them, add social links in a future nav/footer component and/or in `README.md`.

## Design tokens

Global **red · white · black** palette lives in `src/app/globals.css` (`--background`, `--foreground`, `--accent`). The hero uses near-black `#030303`, white type, and **red-500** accents in `HeroCaptionOverlay` and the blob stroke in `HeroRevealSvg`.

## Project layout (components)

| Path | Purpose |
|------|---------|
| `src/components/HeroScene.tsx` | Full-screen hero: wires mouse + hover + child layers |
| `src/components/HeroBaseImage.tsx` | Next.js `Image` base layer |
| `src/components/HeroRevealSvg.tsx` | SVG blob clip + reveal image + outline stroke |
| `src/components/HeroCaptionOverlay.tsx` | Bottom gradient copy on hover |
| `src/components/useOrganicBlobClip.ts` | Organic blob path animation + `window.__setBlobActive` bridge |

See **`README.md`** for full resume text and creative direction.
