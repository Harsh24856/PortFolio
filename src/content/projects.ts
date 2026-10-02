/* One source of truth for every place a project appears: the cloth cards, the
   datasheet book, the toolkit matrix and the case-study pages. Facts here come
   from the resume and the shipped products; nothing is estimated. */

export type NodeKind = "client" | "service" | "model" | "data" | "external"

export type ArchNode = {
  id: string
  label: string
  sub?: string
  kind: NodeKind
  /** grid cell, column then row */
  at: [number, number]
}

export type ArchEdge = { from: string; to: string; label?: string }

export type Project = {
  slug: string
  name: string
  year: string
  kind: string
  summary: string
  image: string
  imageAlt: string
  stack: string[]
  links: { label: string; href: string }[]
  problem: string
  built: string[]
  decisions: { title: string; body: string }[]
  outcome: string
  sheet: { k: string; v: string }[]
  arch: { cols: number; rows: number; nodes: ArchNode[]; edges: ArchEdge[] }
}

export const projects: Project[] = [
  {
    slug: "uav-engine",
    name: "UAV Engine",
    year: "2026",
    kind: "Digital twin",
    summary:
      "A digital twin of a UAV piston engine. A live physics simulation feeds neural networks that flag faults and estimate remaining engine life.",
    image: "/shots/uav.jpg",
    imageAlt:
      "UAV Engine dashboard: live telemetry feed with altitude, throttle and airspeed gauges, engine health and fault status panels.",
    stack: ["Next.js", "FastAPI", "Python", "TensorFlow", "Keras", "Supabase"],
    links: [{ label: "Source on GitHub", href: "https://github.com/Harsh24856/AirSim" }],
    problem:
      "Engine faults on a small UAV are hard to see from the ground, and testing fault detection on a real engine is slow and risky. A simulated engine can be pushed into failure as often as needed.",
    built: [
      "A physics simulation of a piston engine that responds to throttle, airspeed and altitude in real time.",
      "Neural networks trained on simulated runs: one classifies faults, one estimates remaining useful life.",
      "A cockpit-style dashboard that streams telemetry, engine health and fault status while you fly.",
    ],
    decisions: [
      {
        title: "Simulate first, then learn",
        body: "The models are trained on telemetry the simulation produces, so healthy and faulted runs can be generated on demand instead of waiting for real failures.",
      },
      {
        title: "Keep the models in Python",
        body: "FastAPI serves both the simulation and inference, so TensorFlow and Keras stay where they are strongest and the Next.js front end only renders.",
      },
      {
        title: "Two questions, two models",
        body: "Is something wrong right now, and how long until it will be. Fault detection is a classification problem and remaining life is a regression problem, so each gets its own network.",
      },
    ],
    outcome:
      "A working twin you can fly from the browser: telemetry, fault status and the remaining-life estimate update live as the engine is pushed.",
    sheet: [
      { k: "Type", v: "Digital twin" },
      { k: "Front end", v: "Next.js" },
      { k: "Services", v: "FastAPI, Python" },
      { k: "Models", v: "TensorFlow, Keras" },
      { k: "Storage", v: "Supabase" },
    ],
    arch: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: "ui", label: "Dashboard", sub: "Next.js", kind: "client", at: [0, 1] },
        { id: "api", label: "API", sub: "FastAPI", kind: "service", at: [1, 1] },
        { id: "sim", label: "Physics simulation", sub: "Python", kind: "service", at: [2, 0] },
        { id: "fault", label: "Fault classifier", sub: "TensorFlow", kind: "model", at: [2, 1] },
        { id: "rul", label: "Remaining life", sub: "Keras", kind: "model", at: [2, 2] },
        { id: "db", label: "Runs and telemetry", sub: "Supabase", kind: "data", at: [1, 2] },
      ],
      edges: [
        { from: "ui", to: "api", label: "REST" },
        { from: "api", to: "sim" },
        { from: "api", to: "fault" },
        { from: "api", to: "rul" },
        { from: "api", to: "db" },
      ],
    },
  },
  {
    slug: "bassh",
    name: "Bassh",
    year: "2025",
    kind: "Community and events",
    summary:
      "Real-time discovery of nearby clubs, communities and events, with live heatmaps of where the city is tonight.",
    image: "/shots/bassh.jpg",
    imageAlt: "Bassh mobile app: a city map with a heatmap of club activity and rated venue pins.",
    stack: ["Next.js", "React Native", "Expo", "Node.js", "PostgreSQL", "Supabase"],
    links: [{ label: "Live site", href: "https://bassh-green.vercel.app" }],
    problem:
      "Finding out what is happening nearby means checking a dozen group chats and pages. Bassh puts clubs, communities and events on one map, ranked by what is active right now.",
    built: [
      "A cross-platform app for Android and the web, sharing one back end.",
      "Geolocation-based heatmaps that show live club activity and engagement across the city.",
      "Secure authentication and REST APIs on Node.js, Supabase and PostgreSQL.",
    ],
    decisions: [
      {
        title: "One API for app and web",
        body: "The Expo app and the Next.js site call the same Node.js REST API, so features ship once and behave the same on both.",
      },
      {
        title: "Heat, not pins",
        body: "A list of venues says what exists. A heatmap of activity says where people actually are, which is the question a night-out app has to answer.",
      },
      {
        title: "Managed auth and data",
        body: "Supabase handles authentication on top of PostgreSQL, which kept the security surface small while the product changed quickly.",
      },
    ],
    outcome: "Live on the web, with an Android build distributed through Expo.",
    sheet: [
      { k: "Type", v: "Mobile and web app" },
      { k: "Clients", v: "React Native (Expo), Next.js" },
      { k: "API", v: "Node.js, REST" },
      { k: "Data", v: "PostgreSQL, Supabase" },
      { k: "Signature", v: "Live activity heatmaps" },
    ],
    arch: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: "app", label: "Mobile app", sub: "React Native, Expo", kind: "client", at: [0, 0] },
        { id: "web", label: "Web app", sub: "Next.js", kind: "client", at: [0, 2] },
        { id: "api", label: "REST API", sub: "Node.js", kind: "service", at: [1, 1] },
        { id: "db", label: "PostgreSQL", sub: "Supabase", kind: "data", at: [2, 0] },
        { id: "auth", label: "Auth", sub: "Supabase", kind: "external", at: [2, 1] },
        { id: "heat", label: "Activity heatmaps", sub: "Geolocation", kind: "service", at: [2, 2] },
      ],
      edges: [
        { from: "app", to: "api" },
        { from: "web", to: "api" },
        { from: "api", to: "db" },
        { from: "api", to: "auth" },
        { from: "api", to: "heat" },
      ],
    },
  },
  {
    slug: "docspace",
    name: "DocSpace",
    year: "2025",
    kind: "Healthcare hiring",
    summary:
      "Doctor verification and hospital hiring. OCR reads the medical licence, an automated check confirms it against the registry.",
    image: "/shots/docspace.jpg",
    imageAlt: "DocSpace landing page: Connect, Collaborate, Save Lives, with an illustration of a doctor at a laptop.",
    stack: ["React", "Node.js", "Express", "PostgreSQL", "Supabase", "Docker", "Google Vision", "Socket.IO", "Python", "Playwright"],
    links: [{ label: "Live site", href: "https://doc-space-pink.vercel.app" }],
    problem:
      "Hospitals hiring doctors have to verify every licence by hand before a conversation can start. DocSpace verifies first, so hiring starts from a trusted profile.",
    built: [
      "Doctor verification, job discovery and hospital hiring workflows in one platform.",
      "Automated licence validation: Google Vision OCR reads the licence, a Playwright scraper checks it against the government registry.",
      "Real-time doctor and hospital messaging, and admin dashboards for verification, over Socket.IO.",
    ],
    decisions: [
      {
        title: "Read, then confirm",
        body: "OCR alone can misread a licence number, and a registry lookup alone needs clean input. Chaining them, OCR into an automated registry check, turns a photo into a verified record.",
      },
      {
        title: "A browser where there is no API",
        body: "The registry has no public API, so a Python and Playwright worker drives it like a person would and returns a structured result.",
      },
      {
        title: "Humans stay in the loop",
        body: "Admins review and approve verifications from a dashboard, so the automation speeds the check up without having the last word.",
      },
    ],
    outcome: "Live on the web, with verification, hiring and messaging working end to end.",
    sheet: [
      { k: "Type", v: "Verification and hiring platform" },
      { k: "Front end", v: "React" },
      { k: "API", v: "Express on Node.js, Docker" },
      { k: "Verification", v: "Google Vision OCR, Playwright" },
      { k: "Real time", v: "Socket.IO" },
    ],
    arch: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: "web", label: "Web app", sub: "React", kind: "client", at: [0, 0] },
        { id: "admin", label: "Admin dashboard", sub: "React", kind: "client", at: [0, 2] },
        { id: "rt", label: "Messaging", sub: "Socket.IO", kind: "service", at: [1, 0] },
        { id: "api", label: "API", sub: "Express, Docker", kind: "service", at: [1, 1] },
        { id: "ocr", label: "Licence OCR", sub: "Google Vision", kind: "external", at: [2, 0] },
        { id: "reg", label: "Registry check", sub: "Python, Playwright", kind: "service", at: [2, 1] },
        { id: "db", label: "PostgreSQL", sub: "Supabase", kind: "data", at: [2, 2] },
      ],
      edges: [
        { from: "web", to: "rt" },
        { from: "web", to: "api" },
        { from: "admin", to: "api" },
        { from: "api", to: "ocr" },
        { from: "api", to: "reg" },
        { from: "api", to: "db" },
      ],
    },
  },
  {
    slug: "matricare",
    name: "MatriCare",
    year: "2024",
    kind: "Maternal health",
    summary:
      "Offline-first maternal health risk detection with machine learning, built for places where clinics are far.",
    image: "/shots/matricare.jpg",
    imageAlt: "MatriCare cover art: a mother and child silhouetted against a tricolour wash.",
    stack: ["React", "React Native", "Node.js", "PostgreSQL", "Python"],
    links: [{ label: "Source on GitHub", href: "https://github.com/Harsh24856/Matri_App" }],
    problem:
      "Pregnancy risks are easiest to act on early, but the places that need monitoring most often have the weakest connectivity. The tool has to work without a signal.",
    built: [
      "An offline-first mobile and web system that flags pregnancy risks with machine learning models.",
      "Structured data collection that feeds government health monitoring and early intervention programmes.",
      "Role-based interfaces for mothers, frontline health workers and administrators.",
    ],
    decisions: [
      {
        title: "Offline is the default",
        body: "Records are captured on the device first and synced when a connection returns, so a visit is never lost to a dead zone.",
      },
      {
        title: "Three users, three interfaces",
        body: "A mother, a frontline worker and an administrator need different things from the same record, so each role gets its own view rather than one screen with permissions bolted on.",
      },
      {
        title: "Structured from the first field",
        body: "Data is collected in the shape health programmes report on, so it can feed monitoring without a cleanup step.",
      },
    ],
    outcome: "A working mobile and web system with risk detection and role-based access.",
    sheet: [
      { k: "Type", v: "Offline-first health system" },
      { k: "Clients", v: "React Native, React" },
      { k: "API", v: "Node.js" },
      { k: "Models", v: "Python, machine learning" },
      { k: "Data", v: "PostgreSQL" },
    ],
    arch: {
      cols: 3,
      rows: 3,
      nodes: [
        { id: "app", label: "Mobile app", sub: "React Native", kind: "client", at: [0, 0] },
        { id: "store", label: "Offline store", sub: "Syncs when online", kind: "data", at: [0, 1] },
        { id: "admin", label: "Admin web", sub: "React", kind: "client", at: [0, 2] },
        { id: "api", label: "API", sub: "Node.js", kind: "service", at: [1, 1] },
        { id: "risk", label: "Risk models", sub: "Python", kind: "model", at: [2, 0] },
        { id: "db", label: "PostgreSQL", kind: "data", at: [2, 2] },
      ],
      edges: [
        { from: "app", to: "store" },
        { from: "store", to: "api", label: "sync" },
        { from: "admin", to: "api" },
        { from: "api", to: "risk" },
        { from: "api", to: "db" },
      ],
    },
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
