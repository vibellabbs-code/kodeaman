import { CountUp, StaggerContainer, StaggerItem } from './animations'

const stats = [
  { value: 30, suffix: '+', label: 'Packages' },
  { value: 8, suffix: '', label: 'Scanners' },
  { value: 6, suffix: '', label: 'Languages' },
  { value: 80, suffix: '+', label: 'Coaching Templates' },
]

export function Stats() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <StaggerContainer className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
              <div className="text-5xl font-bold tracking-tight text-[#fafafa]">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
