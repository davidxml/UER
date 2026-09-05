import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncidents } from '../context/IncidentContext'
import { clearResponderSession, readResponderSession } from './responderAuth'
import DispatchPanel from './DispatchPanel'
import IncidentQueue from './IncidentQueue'
import type { QueueFilter } from './IncidentQueue'
import Sidebar from './Sidebar'

/**
 * Composes the responder console. The active department comes from the
 * persisted responder session (guarded at the route layer), and incident data
 * flows from the shared, localStorage-synced IncidentContext — so status
 * changes here appear on the Reporter's Tracking screen live.
 */
export default function ResponderDashboard() {
  const navigate = useNavigate()
  const { incidents } = useIncidents()
  const department = readResponderSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<QueueFilter>('All')

  // The route guard guarantees a session; this is purely a defensive fallback.
  if (!department) return null

  const handleSwitchUnit = () => {
    clearResponderSession()
    navigate('/responder/login', { replace: true })
  }

  const selectedIncident = incidents.find((i) => i.id === selectedId)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-gray font-sans">
      <Sidebar department={department} onSwitchUnit={handleSwitchUnit} />
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
