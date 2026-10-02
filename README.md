# Harsh Sehra | portfolio

A night walk through a live WebGL temple. The scroll moves the camera through chapters: hero, About, Work, Sketchbook, Toolkit and Contact. Projects hang in the scene as wind-blown cloth, and an illustrated sketchbook sits in a lit window.

The scene engine and the sketchbook are ThreeUI landing pages (Kage and Sketchbook), vendored byte-exact under `public/landing-pages/` and checked against the SHA-256 hashes in their specs. The portfolio layer on top is this repo's own.

## How it is put together

| Path | Purpose |
|------|---------|
| `src/site/index.html` | The page: markup, styles, the Kage engine (patched: HARSH wordmark, seven camera waypoints, cloth cards) and the contact form |
| `src/app/route.ts` | Serves that document at `/` and bakes the EmailJS ids into it |
| `src/app/not-found.tsx` | On-brand 404 |
| `public/landing-pages/` | Vendored Kage and Sketchbook files (scene engine, three.js, fonts, foreground cut-outs, sketchbook plates) |
| `public/book/` | Project screenshots hung on the cloth cards |

## Design system

Single dark theme. One accent (vermilion `#e0231c`) for the primary button, the active nav underline and hover washes. Onest throughout. Shapes: panels 14px, fields 10px, buttons and tags pill. Reduced-motion and no-WebGL fallbacks are handled by the engine; the page stays readable as plain HTML.

## Contact form

Posts straight to EmailJS from the browser. Set these in `.env.local`:

```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
```

Without them the form opens the visitor's mail app instead.

---

## Resume (source: `Harsh_Sehra_Resume.docx.pdf`)

### Harsh Sehra

**Software Engineer · Full-Stack & Mobile Development**

**Contact**

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
- Three.js (vendored)  
- TypeScript  

---

## Deploy

Deploy on [Vercel](https://vercel.com) or any Node host that supports Next.js. Set the EmailJS variables in the host's environment before building.
