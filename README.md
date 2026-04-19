# Harsh Sehra — personal site

Next.js (App Router) front end with a **Spider-Man–inspired hero**: a full-screen base image and a **mouse-driven organic blob** that reveals a second image (suit / mask layer). **Palette: red, white, and black** (see `src/app/globals.css`).

## Creative direction

- **Theme:** Spider-Man–style dual identity — everyday photo as the base, hero/mask image inside the moving blob (web fluid silhouette vibe).
- **Colors:** Near-black background (`#030303` / `--background`), **white** typography, **red** accents (blob outline, kicker text). No extra palette unless you extend it.
- **Motion:** Blob follows the pointer with a soft spring; outline stroke reads clearly on dark areas.

## Component map

| File | Responsibility |
|------|------------------|
| [`src/components/HeroScene.tsx`](src/components/HeroScene.tsx) | Composes hero, hover state, image URLs |
| [`src/components/HeroBaseImage.tsx`](src/components/HeroBaseImage.tsx) | Base `next/image` layer |
| [`src/components/HeroRevealSvg.tsx`](src/components/HeroRevealSvg.tsx) | SVG clipPath + `<image>` reveal + stroke |
| [`src/components/HeroCaptionOverlay.tsx`](src/components/HeroCaptionOverlay.tsx) | Bottom gradient text on hover |
| [`src/components/useOrganicBlobClip.ts`](src/components/useOrganicBlobClip.ts) | Blob path math + rAF loop |

Entry: [`src/app/page.tsx`](src/app/page.tsx) renders `<HeroScene />`.

Setup and assets: **[`PREREQUISITE.md`](PREREQUISITE.md)**.

---

## Resume (source: `Harsh_Sehra_Resume.docx.pdf`)

### Harsh Sehra

**Software Engineer · Full-Stack & Mobile Development**

**Contact**

- Phone: +91 9682124943  
- Email: harshsehra1@gmail.com  
- GitHub | LinkedIn *(add URLs in the site when ready)*

---

### Education

**Punjab Engineering College, Chandigarh** — 2024 – 2028  

**B.Tech in Computer Science** · CGPA: **8.91**

---

### Experience

**Freelance Software Developer** — 2024 – Present  

Various startups — Healthtech, SaaS, Analytics

- Built full-stack web applications for early-stage startups, delivering REST APIs, frontend interfaces, and database-backed features end-to-end.
- Supported rapid MVP development and iterative feature releases, working directly with founders to translate product requirements into production code.
- Collaborated across domains including healthtech, SaaS, and analytics, adapting to diverse tech stacks and business contexts.

---

### Projects

#### Bassh — Real-Time Community & Event Discovery

- **Links:** Expo APK (see resume) · <https://bassh-green.vercel.app> · GitHub *(link on resume)*  
- **Stack:** Next.js · React Native (Expo) · Node.js · PostgreSQL · Supabase  
- Built a cross-platform mobile and web app for discovering nearby clubs, communities, and events.  
- Implemented geolocation-based heatmaps to visualize real-time club activity and user engagement.  
- Designed secure authentication and scalable REST APIs using Node.js, Supabase, and PostgreSQL.

#### DocSpace — Healthcare Verification & Hiring Platform

- **Links:** <https://doc-space-pink.vercel.app> · GitHub  
- **Stack:** React.js · Node.js · Express · PostgreSQL (Supabase) · Docker · Google Vision API · Socket.IO · Python  
- Built a scalable platform enabling doctor verification, job discovery, and hospital hiring workflows.  
- Automated medical license validation using OCR (Google Vision API) and government registry scraping with Playwright.  
- Implemented real-time doctor–hospital messaging and admin-driven verification dashboards via Socket.IO.

#### MatriCare — Maternal Health Risk Detection Platform

- **Links:** GitHub *(link on resume)*  
- **Stack:** React · React Native · Node.js · PostgreSQL · Python (ML)  
- Developed an offline-first mobile and web system to detect pregnancy risks using machine learning models.  
- Enabled structured data collection for government health monitoring and early medical intervention programs.  
- Designed role-based interfaces for mothers, frontline healthcare workers, and administrators.

---

### Technical skills

- Full-Stack Development  
- React · Next.js · React Native  
- Node.js · Express  
- PostgreSQL · Supabase  
- Python · Machine Learning  
- Docker · DevOps  
- REST API Design  
- Real-Time Systems (Socket.IO)  
- OCR & Web Automation  
- System Design  
- C++ · Java · JavaScript  
- Git & Version Control  

---

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # run production server
npm run lint   # eslint
```

## Stack

- [Next.js](https://nextjs.org) 16  
- React 19  
- Tailwind CSS 4  
- TypeScript  

---

## Deploy

Deploy on [Vercel](https://vercel.com) or any Node host that supports Next.js. Ensure `public/images/11.png` and `public/images/12.png` are included in the deployment artifact.
