import { ClockIcon, MapPinIcon } from '../components/icons'
import type { Incident } from '../shared/types'
import { STATUS_BADGE } from './statusStyles'

type IncidentCardProps = {
  incident: Incident
  selected: boolean
  onSelect: () => void
}

/** Splits the comma-joined tagged field back into individual department chips. */
function taggedChips(tagged: string): string[] {
  return tagged
    .split(',')
    .map((dept) => dept.trim())
    .filter(Boolean)
}

/**
 * A single incident row in the responder queue: status badge, type, location,
 * time, and the tagged departments as chips.
 */
export default function IncidentCard({
  incident,
  selected,
  onSelect,
}: IncidentCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
        selected
          ? 'border-unilag-maroon bg-surface-white shadow-md'
          : 'border-transparent bg-surface-white shadow-sm hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[incident.status]}`}
        >
          {incident.status}
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-ink-muted">
          <ClockIcon className="h-3 w-3" />
          {incident.time}
        </span>
      </div>

      <h3 className="font-bold text-ink-main">{incident.type}</h3>

      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        <MapPinIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{incident.locationText}</span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {taggedChips(incident.tagged).map((dept) => (
          <span
            key={dept}
            className="rounded-md border border-gray-200 bg-surface-gray px-2 py-1 text-xs font-semibold text-ink-muted"
          >
            {dept}
          </span>
        ))}
      </div>
    </button>
  )
}
