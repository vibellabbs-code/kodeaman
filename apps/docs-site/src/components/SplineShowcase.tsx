import { SplineScene } from '@/components/ui/splite'
import { Card } from '@/components/ui/card'
import { Spotlight } from '@/components/ui/spotlight'

export function SplineShowcase() {
  return (
    <section id="interactive" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="w-full min-h-[500px] bg-black/[0.96] relative overflow-hidden border-zinc-800">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          <div className="flex flex-col md:flex-row h-full min-h-[500px]">
            {/* Left content */}
            <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-500 mb-4">
                Interactive Security
              </p>
              <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                Real-time threat visualization
              </h2>
              <p className="mt-6 text-neutral-300 max-w-lg leading-relaxed">
                Aspida scans your code in real time, mapping vulnerabilities across your architecture.
                Watch threats emerge, get prioritized, and resolve as your team applies fixes.
              </p>
              <div className="mt-8 flex gap-4">
                <a
                  href="#get-started"
                  className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_36px_rgba(20,184,166,0.3)] transition hover:bg-teal-400"
                >
                  Try the scanner
                </a>
              </div>
            </div>

            {/* Right 3D scene */}
            <div className="flex-1 relative min-h-[300px]">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
