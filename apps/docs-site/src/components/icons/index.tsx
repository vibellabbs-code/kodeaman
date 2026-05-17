import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3.5 19 6v5.3c0 4.2-2.8 7.9-7 9.2-4.2-1.3-7-5-7-9.2V6l7-2.5Z" />
      <path d="M12 7v9" />
    </svg>
  )
}

export function CodeBracketIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="m9 7-5 5 5 5" />
      <path d="m15 7 5 5-5 5" />
    </svg>
  )
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5s-1.1 6.2-3.3 8.5" />
      <path d="M12 3.5C9.8 5.8 8.7 8.6 8.7 12s1.1 6.2 3.3 8.5" />
    </svg>
  )
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V6" />
      <path d="M17 16v-4" />
      <path d="m6 11 5-5 4 4 4-5" />
    </svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5A2.5 2.5 0 0 0 8 11" />
      <path d="M16 6h2.5A2.5 2.5 0 0 1 16 11" />
      <path d="M12 13v4" />
      <path d="M8.5 20h7" />
      <path d="M10 17h4" />
    </svg>
  )
}

export function PuzzleIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M9 4h4v3a2 2 0 1 0 4 0V4h3v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4h5Z" />
    </svg>
  )
}

export function ChecklistIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" />
      <path d="m8 11 1.5 1.5L12 10" />
      <path d="M14 12h2" />
      <path d="m8 16 1.5 1.5L12 15" />
      <path d="M14 17h2" />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}
