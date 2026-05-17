import { motion } from 'framer-motion'
import { ScrollReveal } from './animations'

const steps = [
  { title: 'Scan', description: 'Run scanners on your codebase' },
  { title: 'Analyze', description: 'Deduplicate and prioritize findings' },
  { title: 'Coach', description: 'Bilingual explanations and fix suggestions' },
  { title: 'Fix', description: 'Apply remediations with confidence' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-zinc-800 bg-zinc-900/45 p-8 lg:p-12">
        <ScrollReveal>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-500">Workflow</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#fafafa]">Four steps to secure code</h2>
        </ScrollReveal>
        <div className="mt-14 grid gap-8 lg:grid-cols-4 lg:gap-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, delay: index * 0.16 }}
            >
              {index < steps.length - 1 && <div className="absolute left-6 top-6 hidden h-px w-full bg-zinc-800 lg:block" />}
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-teal-500/35 bg-black text-sm font-semibold text-teal-400 shadow-[0_0_24px_rgba(20,184,166,0.18)]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-[#fafafa]">{step.title}</h3>
              <p className="mt-3 max-w-xs text-base leading-7 text-zinc-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
