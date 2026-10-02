/* The toolkit, in four groups. Each group is wired to one row of keys on
   the board (see TOOL_KEYS in src/engine/board.ts), so a group holds at
   most as many tools as its row has keys. */

export type ToolGroup = {
  name: string
  tools: string[]
}

export const toolGroups: ToolGroup[] = [
  {
    name: "Generative AI and ML",
    tools: [
      "LangChain",
      "LangGraph",
      "LLM integration",
      "RAG",
      "OpenAI API",
      "Hugging Face",
      "TensorFlow",
      "Keras",
      "Neural networks",
      "Python",
    ],
  },
  {
    name: "Frontend and mobile",
    tools: ["React", "Next.js", "React Native", "Expo", "TypeScript", "JavaScript", "Tailwind CSS", "HTML and CSS"],
  },
  {
    name: "Backend",
    tools: ["Node.js", "Express", "FastAPI", "REST APIs", "Socket.IO", "Docker", "Git", "Java", "C++"],
  },
  {
    name: "Data and automation",
    tools: ["PostgreSQL", "Supabase", "MongoDB", "Firebase", "OCR", "Playwright", "System design"],
  },
]
