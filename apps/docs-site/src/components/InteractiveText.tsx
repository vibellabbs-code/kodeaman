import { useRef } from 'react'
import TextCursorProximity from '@/components/ui/text-cursor-proximity'

export function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-800"
          ref={containerRef}
          style={{
            backgroundColor: '#0a0a0a',
            minHeight: '400px',
          }}
        >
          <div className="flex flex-col justify-center uppercase leading-none pt-12 pl-8 md:pl-12">
            <TextCursorProximity
              label="ASPIDA"
              className="text-4xl will-change-transform sm:text-6xl md:text-7xl lg:text-8xl font-bold"
              styles={{
                transform: {
                  from: 'scale(1)',
                  to: 'scale(1.3)',
                },
                color: {
                  from: '#FFFFFF',
                  to: '#14b8a6',
                },
              }}
              falloff="gaussian"
              radius={120}
              containerRef={containerRef}
            />
            <TextCursorProximity
              label="SECURITY"
              className="leading-none text-4xl will-change-transform sm:text-6xl md:text-7xl lg:text-8xl font-bold"
              styles={{
                transform: {
                  from: 'scale(1)',
                  to: 'scale(1.3)',
                },
                color: {
                  from: '#71717a',
                  to: '#14b8a6',
                },
              }}
              falloff="gaussian"
              radius={120}
              containerRef={containerRef}
            />
            <TextCursorProximity
              label="COACHING"
              className="leading-none text-4xl will-change-transform sm:text-6xl md:text-7xl lg:text-8xl font-bold"
              styles={{
                transform: {
                  from: 'scale(1)',
                  to: 'scale(1.3)',
                },
                color: {
                  from: '#3f3f46',
                  to: '#14b8a6',
                },
              }}
              falloff="gaussian"
              radius={120}
              containerRef={containerRef}
            />
          </div>

          <div className="absolute bottom-6 left-8 md:left-12 right-8 md:right-12 flex justify-between items-end">
            <p className="text-sm text-zinc-500 max-w-md">
              Move your cursor to interact. Aspida adapts to your code, guiding you toward secure practices.
            </p>
            <TextCursorProximity
              className="hidden sm:block text-xs text-zinc-600"
              label="INTERACTIVE"
              styles={{
                transform: {
                  from: 'scale(1)',
                  to: 'scale(1.2)',
                },
                color: {
                  from: '#52525b',
                  to: '#14b8a6',
                },
              }}
              falloff="linear"
              radius={60}
              containerRef={containerRef}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
