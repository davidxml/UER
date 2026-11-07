import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIncidents } from '../context/IncidentContext'
import DispatchPanel from './DispatchPanel'
import IncidentQueue from './IncidentQueue'
import type { QueueFilter } from './IncidentQueue'
import Sidebar from './Sidebar'

/**
 * Composes the responder console. The active unit comes from the signed-in
 * responder account; incident data is provided by the scope="responder"
 * IncidentProvider and updates over WebSocket.
 */
export default function ResponderDashboard() {
  const navigate = useNavigate()
  const { incidents } = useIncidents()
  const { logout, user } = useAuth()
  const department = user?.department ?? null
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<QueueFilter>('All')

  if (!department) return null

  const handleSignOut = () => {
    void logout().finally(() => navigate('/login', { replace: true }))
  }

  const selectedIncident = incidents.find((i) => i.id === selectedId)
  const dept = department as import('../shared/constants').Department

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-gray font-sans">
      <Sidebar department={dept} onSignOut={handleSignOut} />
      <IncidentQueue
        department={dept}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <DispatchPanel incident={selectedIncident} />
    </div>
  )
}
