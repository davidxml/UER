import { useState } from 'react'
import { useIncidents } from '../context/IncidentContext'
import type { Department } from '../shared/constants'
import DispatchPanel from './DispatchPanel'
import IncidentQueue from './IncidentQueue'
import type { QueueFilter } from './IncidentQueue'
import ResponderLogin from './ResponderLogin'
import Sidebar from './Sidebar'

/**
 * Composes the responder console. Holds only local UI state (department,
 * selected incident, active tab) — the incident data itself flows from
 * IncidentContext (shared, localStorage-synced) so status changes here appear
 * on the Reporter's Tracking screen live.
 */
export default function ResponderDashboard() {
  const { incidents } = useIncidents()
  const [department, setDepartment] = useState<Department | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<QueueFilter>('All')

  if (!department) {
    return <ResponderLogin onLogin={setDepartment} />
  }

  const handleDepartmentChange = () => {
    // The active tab filter and selection may not apply to a new unit.
    setActiveTab('All')
    setSelectedId(null)
  }

  const selectedIncident = incidents.find((i) => i.id === selectedId)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-gray font-sans">
      <Sidebar department={department} onSwitchUnit={handleDepartmentChange} />
      <IncidentQueue
        department={department}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <DispatchPanel incident={selectedIncident} />
    </div>
  )
}
