import { useNavigate } from 'react-router-dom'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
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
      <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-white px-8 text-center">
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
    <main className="flex min-h-dvh flex-col bg-surface-white">
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
        {/* Hardcoded map to the UNILAG Senate Building for the MVP */}
        <div className="relative h-48 w-full bg-gray-200">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.856987747806!2d3.3983279147711467!3d6.517086895286596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8ce8ab6e2f17%3A0x889812423b490f!2sSenate%20House%2C%20University%20Of%20Lagos!5e0!3m2!1sen!2sng!4v1693760000000!5m2!1sen!2sng"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title="Incident location map"
          />
          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm backdrop-blur-sm">
            {incident.locationText || 'Senate Building Tracked'}
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

          {incident.images && incident.images.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                Attached Photos
              </h4>
              <div className="flex flex-wrap gap-2">
                {incident.images.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Photo ${index + 1}`}
                    className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
