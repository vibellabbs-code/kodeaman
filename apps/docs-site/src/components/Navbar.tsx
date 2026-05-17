import { ShieldIcon } from './icons'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Get Started', href: '#get-started' },
  { label: 'GitHub', href: 'https://github.com/vibellabbs-code/aspidasec' },
]

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-black/50 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="#hero" className="flex items-center gap-3 text-sm font-semibold tracking-tight text-[#fafafa]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.18)]">
            <ShieldIcon className="h-5 w-5" />
          </span>
          <span className="text-lg">AspidaSec</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-zinc-400 transition hover:text-[#fafafa]">
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}
