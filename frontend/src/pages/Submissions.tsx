import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
} from '../components/icons'
import { useIncidents } from '../context/IncidentContext'
import type { IncidentStatus } from '../context/IncidentContext'

const STATUS_STYLES: Record<IncidentStatus, string> = {
  Reported: 'bg-status-warning/20 text-status-warning',
  'En Route': 'bg-unilag-maroon/10 text-unilag-maroon',
  Resolved: 'bg-status-success/20 text-status-success',
}

export default function Submissions() {
  const navigate = useNavigate()
  const { incidents, viewIncident } = useIncidents()

  return (
    <main className="flex min-h-dvh flex-col bg-surface-white">
      <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('/home')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-unilag-maroon"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-unilag-maroon">My Submissions</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {incidents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <p className="text-sm font-semibold text-ink-main">
              No submissions yet
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Incidents you report from the chat screen will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-6 rounded-lg bg-unilag-maroon px-6 py-3 font-semibold text-white"
            >
              Report an Incident
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => {
                  viewIncident(incident.id)
                  navigate(`/tracking`)
                }}
                className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-100 bg-surface-white p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="mb-1 block text-xs font-bold text-ink-muted">
                      {incident.id}
                    </span>
                    <h3 className="font-semibold text-ink-main">
                      {incident.type}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[incident.status]}`}
                  >
                    {incident.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-ink-muted">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{incident.locationText || incident.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Today, {incident.time}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="rounded-full bg-surface-gray px-2 py-1 text-xs font-medium text-ink-muted">
                    @ {incident.tagged}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
