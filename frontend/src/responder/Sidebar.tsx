import { ShieldAlertIcon } from '../components/icons'
import type { Department } from '../shared/constants'

type SidebarProps = {
  department: Department
  onSwitchUnit: () => void
}

/**
 * Nav shell for the responder console. Shows the branding, the active unit
 * currently signed in, and a control to switch/back out of that unit.
 */
export default function Sidebar({ department, onSwitchUnit }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-surface-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <ShieldAlertIcon className="h-7 w-7 text-unilag-maroon" />
        <h1 className="text-xl font-bold tracking-wider text-unilag-maroon">
          UER DISPATCH
        </h1>
      </div>

      <div className="flex-1" />

      <div className="border-t border-gray-200 p-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Active Unit
        </p>
        <p className="truncate font-semibold text-ink-main">
          {department} Command
        </p>
        <button
          type="button"
          onClick={onSwitchUnit}
          className="mt-3 w-full rounded-lg border border-unilag-maroon py-2 text-sm font-semibold text-unilag-maroon transition-colors hover:bg-unilag-maroon hover:text-surface-white"
        >
          Switch Unit
        </button>
      </div>
    </aside>
  )
}
