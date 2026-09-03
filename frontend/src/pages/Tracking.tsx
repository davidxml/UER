import { useNavigate } from 'react-router-dom'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  MapPinIcon,
  ShieldIcon,
} from '../components/icons'
import { useIncidents } from '../context/IncidentContext'

/**
 * Maps an incident's status to how many of the three tracking steps are
 * considered complete. Timelines only move forward in this prototype.
 */
const STEP_COUNT: Record<string, number> = {
  Reported: 1,
  'En Route': 2,
  Resolved: 3,
}

export default function Tracking() {
  const navigate = useNavigate()
  const { incidents, activeIncidentId } = useIncidents()

  const incident =
    incidents.find((item) => item.id === activeIncidentId) ?? incidents[0]

  if (!incident) {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-surface-white px-8 text-center">
        <p className="text-sm font-semibold text-ink-main">
          No incident selected
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-6 rounded-lg bg-unilag-maroon px-6 py-3 font-semibold text-white"
        >
          Back to Reporting
        </button>
      </main>
    )
  }

  const completeSteps = STEP_COUNT[incident.status] ?? 1

  const steps = [
    {
      icon: <CheckCircle2Icon className="h-5 w-5" />,
      title: 'Report Received',
      detail: `${incident.time} - Logged in system`,
    },
    {
      icon: <ShieldIcon className="h-5 w-5" />,
      title: 'Dispatch Notified',
      detail: `Routed to ${incident.tagged}`,
    },
    {
      icon: <AlertTriangleIcon className="h-5 w-5" />,
      title: 'Responders En Route',
      detail: 'Awaiting confirmation',
    },
  ]

  return (
    <main className="flex h-screen flex-col bg-surface-white">
      <header className="flex items-center border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate('/submissions')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-unilag-maroon"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="flex-grow text-center text-lg font-bold text-unilag-maroon">
          Incident Details
        </h1>
        <div className="w-11" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Map placeholder */}
        <div className="relative flex h-48 w-full items-center justify-center bg-surface-gray">
          <div className="z-10 animate-bounce rounded-full bg-surface-white p-3 shadow-lg">
            <MapPinIcon className="h-6 w-6 text-unilag-maroon" />
          </div>
          <div className="absolute bottom-2 left-2 rounded-md bg-surface-white/90 px-3 py-1 text-xs font-bold text-ink-main shadow-sm backdrop-blur-sm">
            Live Location Tracked
          </div>
        </div>

        <div className="p-6">
          <h2 className="mb-1 text-2xl font-bold text-ink-main">
            {incident.type}
          </h2>
          <p className="mb-6 font-medium text-ink-muted">{incident.id}</p>

          {/* Status timeline — alternating left/right hierarchy around a
              centred spine, with the active steps filled and future ones dimmed */}
          <div className="relative mb-8 flex flex-col gap-8">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-3 bottom-3 w-0.5 -translate-x-1/2 bg-gradient-to-b from-unilag-maroon via-unilag-maroon/30 to-transparent"
            />
            {steps.map((step, index) => {
              const isComplete = index < completeSteps
              // Alternate: step 0 on the right, step 1 on the left…
              const cardOnLeft = index % 2 === 1
              return (
                <div key={step.title} className="relative flex items-center">
                  <div
                    className={`w-1/2 ${cardOnLeft ? 'mr-auto pr-5' : 'ml-auto pl-5'}`}
                  >
                    <div
                      className={`rounded-xl p-4 shadow-sm ${
                        isComplete
                          ? 'border border-gray-100 bg-surface-gray'
                          : 'border border-transparent opacity-50'
                      }`}
                    >
                      <h4 className="text-sm font-bold text-ink-main">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs text-ink-muted">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`absolute left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full shadow ${
                      isComplete
                        ? 'bg-unilag-maroon text-surface-white'
                        : 'bg-surface-gray text-ink-muted'
                    }`}
                  >
                    {step.icon}
                  </span>
                </div>
              )
            })}
          </div>

          {incident.text && (
            <div className="rounded-xl border border-gray-100 bg-surface-gray p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Original Message
              </h4>
              <p className="text-sm italic text-ink-main">"{incident.text}"</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
