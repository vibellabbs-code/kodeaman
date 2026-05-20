import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { GitPullRequest, Languages, LockKeyhole, SearchCode, ShieldCheck, Terminal, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'

type Panel = {
  title: string
  detail: string
  meta: string
  icon: LucideIcon
  className: string
  scale: MotionValue<number>
  tone: string
}

const mobilePanels = [
  { title: 'Input', detail: 'Repo, local app, or deployed URL.', icon: Terminal },
  { title: 'Evidence', detail: 'Scanner output, route, file, confidence, and reproduction context.', icon: SearchCode },
  { title: 'Risk', detail: 'Fix-first ranking based on severity, exposure, and exploitability.', icon: ShieldCheck },
  { title: 'Remediation', detail: 'Practical fix guidance grounded in real findings.', icon: Wrench },
  { title: 'Bilingual context', detail: 'Bahasa Indonesia for team clarity, English for references and audit trails.', icon: Languages },
  { title: 'Review', detail: 'Markdown, HTML, SARIF, JSON, CI result, and PR comments.', icon: GitPullRequest },
]

function CorePanel() {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-emerald-300/18 bg-[#06100f]/92 p-6 shadow-[0_34px_140px_rgba(0,0,0,0.48)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(52,211,153,0.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_44%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h3 className="max-w-sm text-4xl font-semibold leading-tight text-white">One scan becomes a fix path.</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
            AspidaSec turns raw security signals into prioritized, explainable remediation for modern web applications.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/32 p-4 font-mono text-xs leading-6 text-zinc-300">
          <p><span className="text-emerald-300">$</span> aspidasec scan https://app.example.com</p>
          <p className="text-zinc-500">top risks: 5 | invented findings: 0 | report: ready</p>
        </div>
      </div>
    </div>
  )
}

function SatellitePanel({ panel, reducedMotion }: { panel: Panel; reducedMotion: boolean | null }) {
  const Icon = panel.icon

  return (
    <motion.div
      style={{ scale: reducedMotion ? 1 : panel.scale }}
      className="absolute inset-0 z-10 flex items-center justify-center"
    >
      <div className={panel.className}>
        <div className={`h-full overflow-hidden rounded-2xl border border-white/10 bg-[#06100f]/88 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur ${panel.tone}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-200">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{panel.meta}</span>
          </div>
          <h4 className="mt-5 text-xl font-semibold text-white">{panel.title}</h4>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{panel.detail}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function ZoomParallaxFeatures() {
  const container = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  })

  const scaleCore = useTransform(scrollYProgress, [0, 1], [1, 1.55])
  const scaleFast = useTransform(scrollYProgress, [0, 1], [1, 1.9])
  const scaleFaster = useTransform(scrollYProgress, [0, 1], [1, 2.2])
  const scaleDeep = useTransform(scrollYProgress, [0, 1], [1, 2.55])

  const panels: Panel[] = [
    {
      title: 'Input surface',
      detail: 'Accept a repository, a local project, or a deployed URL without changing the developer workflow.',
      meta: 'target',
      icon: Terminal,
      className: 'relative -top-[10vh] left-[5vw] h-[22vh] w-[25vw]',
      scale: scaleFast,
      tone: 'border-emerald-300/10',
    },
    {
      title: 'Scanner evidence',
      detail: 'ZAP, Semgrep, dependency audit, crawler traces, and config review become one evidence set.',
      meta: 'scan',
      icon: SearchCode,
      className: 'relative -left-[27vw] -top-[8vh] h-[33vh] w-[22vw]',
      scale: scaleFaster,
      tone: 'border-sky-300/10',
    },
    {
      title: 'Trust gate',
      detail: 'Guidance can summarize and explain findings, but it cannot create vulnerabilities that scanners did not report.',
      meta: 'ai',
      icon: LockKeyhole,
      className: 'relative left-[28vw] -top-[4vh] h-[27vh] w-[24vw]',
      scale: scaleFast,
      tone: 'border-amber-300/10',
    },
    {
      title: 'Fix guidance',
      detail: 'Each top risk gets a practical remediation path with code-safe examples and references.',
      meta: 'repair',
      icon: Wrench,
      className: 'relative left-[7vw] top-[29vh] h-[24vh] w-[23vw]',
      scale: scaleFaster,
      tone: 'border-emerald-300/10',
    },
    {
      title: 'PR and CI output',
      detail: 'Reports move into Markdown, HTML, SARIF, JSON, CI status, and pull request comments.',
      meta: 'review',
      icon: GitPullRequest,
      className: 'relative -left-[18vw] top-[26vh] h-[23vh] w-[25vw]',
      scale: scaleFaster,
      tone: 'border-violet-300/10',
    },
    {
      title: 'Bilingual context',
      detail: 'Bahasa Indonesia for team clarity, English for audit trails and external references.',
      meta: 'id/en',
      icon: Languages,
      className: 'relative left-[27vw] top-[25vh] h-[20vh] w-[17vw]',
      scale: scaleDeep,
      tone: 'border-teal-300/10',
    },
  ]

  return (
    <section id="scan-workflow" className="relative scroll-mt-28 border-y border-white/10 bg-[#030607]">
      <div className="px-6 py-20 lg:hidden">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl font-semibold leading-tight text-white">Every scan expands into the full fix workflow.</h2>
          <p className="mt-5 text-base leading-8 text-zinc-400">
            The product motion is simple: collect evidence, rank risk, explain the fix, and export it where developers work.
          </p>
          <div className="mt-10 space-y-3">
            {mobilePanels.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{item.detail}</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>

      <div ref={container} className="relative hidden h-[260vh] lg:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.16),transparent_32%),radial-gradient(circle_at_50%_70%,rgba(56,189,248,0.12),transparent_40%)]" />
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.42em] text-emerald-200/50">AspidaSec flow</p>
              <div className="mt-4 flex items-center justify-center gap-8 text-6xl font-semibold tracking-normal text-white/[0.08]">
                <span>SCAN</span>
                <span>RANK</span>
                <span>FIX</span>
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 top-24 z-30 w-full max-w-3xl -translate-x-1/2 px-6 text-center">
            <h2 className="text-5xl font-semibold leading-tight text-white">Every scan expands into the full fix workflow.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              Evidence, prioritization, guidance, and output stay connected as the page moves.
            </p>
          </div>

          <motion.div style={{ scale: reducedMotion ? 1 : scaleCore }} className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="relative h-[34vh] w-[36vw]">
              <CorePanel />
            </div>
          </motion.div>

          {panels.map((panel) => (
            <SatellitePanel key={panel.title} panel={panel} reducedMotion={reducedMotion} />
          ))}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030607] to-transparent" />
        </div>
      </div>
    </section>
  )
}
