import { motion } from 'framer-motion'
import { FadeIn, ParallaxImage } from './animations'
import { ArrowRightIcon } from './icons'

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden px-6 pt-32 pb-24 lg:px-8 lg:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.16),transparent_35%),linear-gradient(180deg,rgba(24,24,27,0.38),transparent_45%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
        <FadeIn>
          <p className="mb-6 inline-flex rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400">
            Open-core security coaching for Indonesian teams
          </p>
          <h1 className="max-w-4xl text-6xl font-bold tracking-tight text-[#fafafa] sm:text-7xl lg:text-7xl">
            Security coaching for developers
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Aspida (Greek: shield) -- Open-core security coach that scans your code, prioritizes findings by real-world risk, and teaches you how to fix issues.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a href="#get-started" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_36px_rgba(20,184,166,0.3)] transition hover:bg-teal-400">
              Get Started
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a href="https://github.com/vibellabbs-code/aspidasec" className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 px-6 py-3 text-sm font-semibold text-[#fafafa] transition hover:border-zinc-700 hover:bg-zinc-900">
              View on GitHub
            </a>
          </div>
        </FadeIn>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.18, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-teal-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
            <ParallaxImage
              src={`${import.meta.env.BASE_URL}nano-banana-v1-bioluminescent-jungle.jpg`}
              alt="Bioluminescent jungle concept art representing AspidaSec security guidance"
              className="aspect-[4/5] w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
