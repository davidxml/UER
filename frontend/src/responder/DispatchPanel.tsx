import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  MapPinIcon,
  ShieldAlertIcon,
} from '../components/icons'
import { useIncidents } from '../context/IncidentContext'
import { useToast } from '../context/ToastContext'
import type { Incident } from '../shared/types'
import { STATUS_BADGE } from './statusStyles'

type DispatchPanelProps = {
  incident: Incident | undefined
}

/** Splits the comma-joined tagged field back into individual department chips. */
function taggedChips(tagged: string): string[] {
  return tagged
    .split(',')
    .map((dept) => dept.trim())
    .filter(Boolean)
}

/**
 * Right column of the responder console. Shows the selected incident's detail
 * and the dispatch actions that advance its status through the shared
 * IncidentContext — which the Reporter's Tracking screen reads live.
 */
export default function DispatchPanel({ incident }: DispatchPanelProps) {
  const { updateIncidentStatus } = useIncidents()
  const { showToast } = useToast()

  const handleStatus = (id: string, status: Incident['status']) => {
    updateIncidentStatus(id, status).catch(() =>
      showToast('error', 'Could not update status. Try again.'),
    )
  }

  if (!incident) {
    return (
      <aside className="flex w-[420px] shrink-0 flex-col bg-surface-white">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-ink-muted">
          <ShieldAlertIcon className="mb-4 h-12 w-12 text-gray-300" />
          <p className="font-medium">
            Select an incident from the queue to view details and take action.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-[420px] shrink-0 flex-col bg-surface-white">
      <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-surface-white px-6">
        <h2 className="text-lg font-bold text-ink-main">Dispatch Command</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="mb-2">
            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[incident.status]}`}
            >
              {incident.status}
            </span>
          </div>
          <h3 className="mb-1 text-2xl font-extrabold text-ink-main">
            {incident.type}
          </h3>
          <span className="font-mono text-sm text-ink-muted">
            {incident.id}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <MapPinIcon className="h-4 w-4" /> Location
            </h4>
            <p className="rounded-lg border border-gray-200 bg-surface-gray p-3 text-base font-medium text-ink-main">
              {incident.locationText}
            </p>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <AlertTriangleIcon className="h-4 w-4" /> Original Report
            </h4>
            <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-base italic text-ink-main">
              "{incident.text}"
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
              Requested Units
            </h4>
            <div className="flex flex-wrap gap-2">
              {taggedChips(incident.tagged).map((dept) => (
                <span
                  key={dept}
                  className="rounded-lg border border-unilag-maroon/20 bg-unilag-maroon/10 px-3 py-1.5 text-sm font-bold text-unilag-maroon"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-surface-gray p-6">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">
          Mutate Status
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleStatus(incident.id, 'En Route')}
            disabled={incident.status !== 'Reported'}
            className="flex items-center justify-center gap-2 rounded-xl bg-status-warning px-4 py-3 font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          >
            <RadioIcon />
            Dispatch Unit
          </button>
          <button
            type="button"
            onClick={() => handleStatus(incident.id, 'Resolved')}
            disabled={incident.status === 'Resolved'}
            className="flex items-center justify-center gap-2 rounded-xl bg-status-success px-4 py-3 font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2Icon className="h-[18px] w-[18px]" />
            Resolve
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-ink-muted">
          Status changes instantly update the student's live tracking view.
        </p>
      </div>
    </aside>
  )
}

function RadioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-[18px] w-[18px]"
    >
      <path d="M4.9 19.1a8 8 0 0 1 0-14.2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 16.2a4 4 0 0 1 0-8.4" />
      <path d="M16.2 7.8a4 4 0 0 1 0 8.4" />
    </svg>
  )
}
