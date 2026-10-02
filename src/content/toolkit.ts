/* The toolkit as a connection matrix: each tool is a row, each project a
   column, and a via marks where one ran on the other. Tools with no shipped
   project behind them are listed separately rather than given empty rows. */

export type ToolGroup = {
  name: string
  tools: { name: string; used: string[] }[]
}

export const toolGroups: ToolGroup[] = [
  {
    name: "AI and ML",
    tools: [
      { name: "Neural networks", used: ["uav-engine"] },
      { name: "TensorFlow", used: ["uav-engine"] },
      { name: "Keras", used: ["uav-engine"] },
      { name: "Machine learning", used: ["uav-engine", "matricare"] },
      { name: "Python", used: ["uav-engine", "docspace", "matricare"] },
    ],
  },
  {
    name: "Interfaces",
    tools: [
      { name: "React", used: ["docspace", "matricare"] },
      { name: "Next.js", used: ["uav-engine", "bassh"] },
      { name: "React Native", used: ["bassh", "matricare"] },
    ],
  },
  {
    name: "Servers",
    tools: [
      { name: "Node.js", used: ["bassh", "docspace", "matricare"] },
      { name: "Express", used: ["docspace"] },
      { name: "FastAPI", used: ["uav-engine"] },
      { name: "REST APIs", used: ["uav-engine", "bassh", "docspace", "matricare"] },
      { name: "Socket.IO", used: ["docspace"] },
      { name: "Docker", used: ["docspace"] },
    ],
  },
  {
    name: "Data and automation",
    tools: [
      { name: "PostgreSQL", used: ["bassh", "docspace", "matricare"] },
      { name: "Supabase", used: ["uav-engine", "bassh", "docspace"] },
      { name: "OCR", used: ["docspace"] },
      { name: "Playwright", used: ["docspace"] },
    ],
  },
]

export const alsoFluent = [
  "Generative AI",
  "LLM integration",
  "Deep learning",
  "TypeScript",
  "JavaScript",
  "C++",
  "Java",
  "Git",
  "System design",
]
