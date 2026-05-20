import { Activity, FileCheck, Gauge, GitPullRequest, Languages, SearchCode, ShieldCheck } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './animations'

const features = [
  {
    title: 'Scan the surface that matters',
    description: 'Run OWASP-oriented checks across routes, dependencies, config, crawler evidence, and scanner output.',
    icon: SearchCode,
  },
  {
    title: 'Rank by production risk',
    description: 'Group duplicate findings and sort by severity, exposure, exploitability, confidence, and fix availability.',
    icon: Gauge,
  },
  {
    title: 'Explain without inventing',
    description: 'AI guidance is grounded in scanner evidence, affected files, affected endpoints, and reproduction context.',
    icon: ShieldCheck,
  },
  {
    title: 'Ship fixes in the workflow',
    description: 'Export readable HTML, Markdown, SARIF, JSON, CI output, and PR comments for developer teams.',
    icon: GitPullRequest,
  },
]

const riskRows = [
  { name: 'A01 Broken Access Control', target: '/api/session', severity: 'Critical', value: 94 },
  { name: 'A03 Injection', target: '/search?q=', severity: 'High', value: 78 },
  { name: 'A05 Misconfiguration', target: 'headers', severity: 'Medium', value: 56 },
]

const evidenceItems = [
  { label: 'Route', value: '/api/session' },
  { label: 'Confidence', value: 'High' },
  { label: 'Language', value: 'ID + EN' },
]

function ProductVisual() {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.025] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.34)]">
      <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_34%_20%,rgba(52,211,153,0.18),transparent_40%),radial-gradient(circle_at_82%_70%,rgba(56,189,248,0.14),transparent_42%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#06100f]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="text-emerald-300">_</span>
            aspidasec risk lens
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          </div>
        </div>

        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-[#06100f] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Fix-first queue</p>
                <p className="mt-1 text-xs text-zinc-500">Deduped from scanner evidence</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                3 live risks
              </span>
            </div>

            <div className="space-y-3">
              {riskRows.map((row) => (
                <div key={row.name} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{row.target}</p>
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${row.severity === 'Critical' ? 'text-red-200' : row.severity === 'High' ? 'text-amber-200' : 'text-sky-200'}`}>
                      {row.severity}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-200 to-red-300" style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#06100f] p-5">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                <FileCheck className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <p className="text-lg font-semibold text-white">Evidence packet</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Every recommendation points back to scanner output, affected assets, and the reason it should be fixed first.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {evidenceItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/24 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <Languages className="h-4 w-4" strokeWidth={1.8} />
                Remediation language
              </div>
              <p className="text-sm leading-7 text-zinc-400">
                Bahasa Indonesia for team clarity, English for references and CI output.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="relative px-6 py-24 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Activity className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <h2 className="max-w-xl text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Built for developers who need fewer findings and better fixes.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              AspidaSec should turn scanner noise into a focused repair path: evidence first, risk ranked, remediation ready.
            </p>

            <StaggerContainer className="mt-9 divide-y divide-white/10 border-y border-white/10">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <StaggerItem key={feature.title}>
                    <article className="flex gap-4 py-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-emerald-200">
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{feature.description}</p>
                      </div>
                    </article>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          </div>

          <div className="lg:col-span-3">
            <ProductVisual />
          </div>
        </div>
      </div>
    </section>
  )
}
