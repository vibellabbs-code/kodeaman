import { CodeBracketIcon, GlobeIcon, ChartIcon, TrophyIcon, PuzzleIcon, ChecklistIcon, ShieldIcon } from './icons'
import { StaggerContainer, StaggerItem } from './animations'

const features = [
  {
    title: 'Multi-Scanner Pipeline',
    description: '8 scanners across 6 languages. Semgrep, ZAP, npm audit, Bandit, gosec, cargo-audit, SpotBugs, Playwright.',
    icon: <div className="flex gap-2"><ShieldIcon className="h-6 w-6" /><CodeBracketIcon className="h-6 w-6" /></div>,
  },
  { title: 'Bilingual Coaching', description: 'Every finding includes remediation in Bahasa Indonesia and English with code examples.', icon: <GlobeIcon className="h-6 w-6" /> },
  { title: 'OWASP Top 10', description: 'Structured scanning organized by OWASP categories A01-A10 with evidence and confidence gates.', icon: <ChecklistIcon className="h-6 w-6" /> },
  { title: 'Smart Prioritization', description: '10+ heuristics including severity, auth-path proximity, internet exposure, and fix availability.', icon: <ChartIcon className="h-6 w-6" /> },
  { title: 'Gamification', description: 'XP, badges, streaks, and quests make security improvements measurable and motivating.', icon: <TrophyIcon className="h-6 w-6" /> },
  { title: 'Integrate Everywhere', description: 'CLI, GitHub bot, GitLab bot, Gitea bot, VS Code extension, MCP server, Docker.', icon: <PuzzleIcon className="h-6 w-6" /> },
]

export function Features() {
  return (
    <section id="features" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-500">Features</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#fafafa]">Built for real-world security</h2>
          <p className="mt-5 text-lg leading-relaxed text-zinc-400">AspidaSec connects scanner evidence, production risk, and practical education so security work becomes focused and repeatable.</p>
        </div>
        <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <article className="group h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-teal-500/35 hover:bg-zinc-900/80">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-black/30 text-teal-500 transition group-hover:border-teal-500/35">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#fafafa]">{feature.title}</h3>
                <p className="mt-3 text-base leading-7 text-zinc-400">{feature.description}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
