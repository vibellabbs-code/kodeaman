import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { ScrollReveal } from './animations'

const snippets = {
  CLI: `git clone https://github.com/vibellabbs-code/aspidasec.git
cd aspidasec && pnpm install && pnpm run build
pnpm --filter @aspidasec/cli start -- scan ./my-project`,
  'MCP Server': `{
  "mcpServers": {
    "aspidasec": {
      "command": "pnpm",
      "args": ["--filter", "@aspidasec/mcp-server", "start"]
    }
  }
}`,
  Docker: `git clone https://github.com/vibellabbs-code/aspidasec.git
cd aspidasec
docker compose up --build
pnpm --filter @aspidasec/cli start -- scan ./my-project`,
}

type Tab = keyof typeof snippets

export function CodeExample() {
  const [activeTab, setActiveTab] = useState<Tab>('CLI')

  return (
    <section id="get-started" className="px-6 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-500">Get Started</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#fafafa]">Get started in seconds</h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-400">Run AspidaSec locally, connect it to an MCP-enabled assistant, or launch the Docker stack for repeatable scanning workflows.</p>
        </ScrollReveal>
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
            <div className="flex gap-2 border-b border-zinc-800 bg-zinc-900/80 p-3">
              {(Object.keys(snippets) as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === tab ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:bg-zinc-800 hover:text-[#fafafa]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative min-h-64 p-6">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-zinc-200"
                >
                  <code>{snippets[activeTab]}</code>
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
