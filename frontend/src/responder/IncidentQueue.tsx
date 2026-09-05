import { useIncidents } from '../context/IncidentContext'
import type { Department } from '../shared/constants'
import type { IncidentStatus } from '../shared/types'
import IncidentCard from './IncidentCard'

export type QueueFilter = 'All' | IncidentStatus

type IncidentQueueProps = {
  department: Department
  activeTab: QueueFilter
  onTabChange: (tab: QueueFilter) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

const TABS: QueueFilter[] = ['All', 'Reported', 'En Route']

/**
 * Middle column of the responder console. Reads the live incident store from
 * IncidentContext and narrows it to incidents routed to the active department,
 * then applies the All/Reported/En Route tab filter on top.
 */
export default function IncidentQueue({
  department,
  activeTab,
  onTabChange,
  selectedId,
  onSelect,
}: IncidentQueueProps) {
  const { incidents } = useIncidents()

  const routedToDepartment = incidents.filter(
    (incident) =>
      incident.tagged === 'General Dispatch' ||
      incident.tagged
        .split(',')
        .map((dept) => dept.trim())
        .includes(department),
  )

  const visible =
    activeTab === 'All'
      ? routedToDepartment
      : routedToDepartment.filter((incident) => incident.status === activeTab)

  return (
    <main className="flex min-w-[350px] flex-1 flex-col border-r border-gray-200 bg-surface-gray">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-surface-white px-6">
        <h2 className="text-lg font-bold text-ink-main">Incoming Reports</h2>
        <div className="flex rounded-lg bg-surface-gray p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-surface-white text-unilag-maroon shadow-sm'
                  : 'text-ink-muted hover:text-ink-main'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <p className="mt-10 text-center text-sm font-medium text-ink-muted">
            No incidents match this filter.
          </p>
        ) : (
          visible.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              selected={incident.id === selectedId}
              onSelect={() => onSelect(incident.id)}
            />
          ))
        )}
      </div>
    </main>
  )
}
