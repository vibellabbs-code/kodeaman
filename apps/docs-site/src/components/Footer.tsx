const columns = [
  { title: 'Product', links: ['Features', 'Docs', 'GitHub'] },
  { title: 'Community', links: ['Contributing', 'Pilot Program'] },
  { title: 'Legal', links: ['Apache 2.0 License'] },
]

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <h2 className="text-xl font-semibold text-[#fafafa]">AspidaSec</h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-zinc-400">Security coaching that helps developers understand, prioritize, and fix vulnerabilities with confidence.</p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href={link === 'GitHub' ? 'https://github.com/vibellabbs-code/aspidasec' : '#'} className="text-sm text-zinc-400 transition hover:text-[#fafafa]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          Copyright 2026 Vibellabbs Code. Built with care for Indonesian developers.
        </div>
      </div>
    </footer>
  )
}
