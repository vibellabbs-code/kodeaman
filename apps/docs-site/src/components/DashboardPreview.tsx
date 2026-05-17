import { ContainerScroll } from '@/components/ui/container-scroll-animation'

export function DashboardPreview() {
  return (
    <section className="bg-[#0a0a0a] overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-500 mb-4">
              Dashboard
            </p>
            <h2 className="text-4xl font-semibold text-[#fafafa]">
              Your security posture at a glance
              <br />
              <span className="text-4xl md:text-[5rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-b from-teal-300 to-teal-600">
                Aspida Dashboard
              </span>
            </h2>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=720&fit=crop&q=80"
          alt="Security dashboard analytics view"
          className="mx-auto rounded-2xl object-cover h-full w-full object-left-top"
          draggable={false}
          loading="lazy"
        />
      </ContainerScroll>
    </section>
  )
}
