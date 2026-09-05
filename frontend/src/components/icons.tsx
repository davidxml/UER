/*
  Local inline icon set. The project has no icon library and only needs a
  handful of glyphs, so these are hand-rolled rather than pulling in a
  dependency. All use `currentColor`, so the Wine colour is inherited from the
  surrounding control.
*/

type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

export function SirenIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M7.5 17.25v-5.5a4.5 4.5 0 0 1 9 0v5.5" />
      <path d="M3.75 17.25h16.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75H3.75a.75.75 0 0 1-.75-.75V18a.75.75 0 0 1 .75-.75z" />
      <path d="M12 4.25V2.75M5.4 6.4 4.35 5.35M18.6 6.4l1.05-1.05M3.5 12.5H2M22 12.5h-1.5" />
    </svg>
  )
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M3.25 9.5A2.25 2.25 0 0 1 5.5 7.25h1.3a1.5 1.5 0 0 0 1.25-.67l.9-1.36a1.5 1.5 0 0 1 1.25-.67h3.6a1.5 1.5 0 0 1 1.25.67l.9 1.36a1.5 1.5 0 0 0 1.25.67h1.3a2.25 2.25 0 0 1 2.25 2.25v7.25a2.25 2.25 0 0 1-2.25 2.25h-13a2.25 2.25 0 0 1-2.25-2.25z" />
      <circle cx="12" cy="13.25" r="3.5" />
    </svg>
  )
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.25 21 10.5 13.5 3 9.75z" />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M12 2.75 4.5 5.5v6c0 4.5 3.1 8.6 7.5 9.75 4.4-1.15 7.5-5.25 7.5-9.75v-6z" />
    </svg>
  )
}

export function ShieldAlertIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M12 2.75 4.5 5.5v6c0 4.5 3.1 8.6 7.5 9.75 4.4-1.15 7.5-5.25 7.5-9.75v-6z" />
      <path d="M12 8.5v4.5M12 16.5h.01" />
    </svg>
  )
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M12 4 21 20H3z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function CheckCircle2Icon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function ReportedIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} className={className}>
      <path d="M9 4.5H7.75A2.25 2.25 0 0 0 5.5 6.75v11.5a2.25 2.25 0 0 0 2.25 2.25h8.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 16.25 4.5H15" />
      <path d="M9.75 3h4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 5.25v-1.5A.75.75 0 0 1 9.75 3z" />
      <path d="M9 11.25h6M9 14.75h3.75" />
    </svg>
  )
}
