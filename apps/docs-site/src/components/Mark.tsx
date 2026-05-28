interface MarkProps {
  size?: number
  color?: string
  corner?: boolean
}

export function KawungMark({ size = 36, color, corner = true }: MarkProps) {
  const fg = color || 'currentColor'
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} className="kmark" aria-hidden="true">
      <g stroke={fg} strokeWidth="1.6" fill="none">
        <ellipse cx="36" cy="20" rx="12" ry="18" />
        <ellipse cx="36" cy="52" rx="12" ry="18" />
        <ellipse cx="20" cy="36" rx="18" ry="12" />
        <ellipse cx="52" cy="36" rx="18" ry="12" />
        <circle cx="36" cy="36" r="2.6" fill={fg} />
      </g>
      {corner && (
        <g stroke={fg} strokeWidth="1.4" fill="none">
          <path d="M2 2 H14 V8 H8 V14 H2 Z" />
          <path d="M70 70 H58 V64 H64 V58 H70 Z" />
        </g>
      )}
    </svg>
  )
}

export function KawungSeal({ size = 220, color }: Pick<MarkProps, 'size' | 'color'>) {
  const fg = color || 'currentColor'
  return (
    <svg viewBox="0 0 220 220" width={size} height={size} className="kseal" aria-hidden="true">
      <g stroke={fg} strokeWidth="1.6" fill="none">
        <path
          d="M14 14 H40 V22 H22 V30 M28 14 H54 V22 H36 V30 M42 14 H68 V22 H50 V30 M56 14 H82 V22 H64 V30 M70 14 H96 V22 H78 V30 M84 14 H110 V22 H92 V30 M98 14 H124 V22 H106 V30 M112 14 H138 V22 H120 V30 M126 14 H152 V22 H134 V30 M140 14 H166 V22 H148 V30 M154 14 H180 V22 H162 V30 M168 14 H194 V22 H176 V30 M182 14 H206 V22 H190 V30"
          opacity="0.85"
        />
      </g>
      <g stroke={fg} strokeWidth="1.4" fill="none">
        <rect x="14" y="14" width="192" height="192" />
        <rect x="20" y="20" width="180" height="180" opacity="0.4" />
      </g>
      <g stroke={fg} strokeWidth="1.6" fill="none">
        <path d="M14 14 H44 V22 H22 V44 H14 Z" />
        <path d="M206 14 H176 V22 H198 V44 H206 Z" />
        <path d="M14 206 H44 V198 H22 V176 H14 Z" />
        <path d="M206 206 H176 V198 H198 V176 H206 Z" />
      </g>
      <g stroke={fg} strokeWidth="2.2" fill="none" transform="translate(110 110)">
        <ellipse cx="0" cy="-32" rx="22" ry="34" />
        <ellipse cx="0" cy="32" rx="22" ry="34" />
        <ellipse cx="-32" cy="0" rx="34" ry="22" />
        <ellipse cx="32" cy="0" rx="34" ry="22" />
        <circle cx="0" cy="0" r="5" fill={fg} />
      </g>
    </svg>
  )
}

export function KawungGlyph({ size = 18, color }: Pick<MarkProps, 'size' | 'color'>) {
  const fg = color || 'currentColor'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g stroke={fg} strokeWidth="1.4" fill="none">
        <ellipse cx="12" cy="5" rx="4" ry="6" />
        <ellipse cx="12" cy="19" rx="4" ry="6" />
        <ellipse cx="5" cy="12" rx="6" ry="4" />
        <ellipse cx="19" cy="12" rx="6" ry="4" />
        <circle cx="12" cy="12" r="1" fill={fg} />
      </g>
    </svg>
  )
}
