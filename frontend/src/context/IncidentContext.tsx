import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { api } from '../lib/api'
import type { Incident, IncidentStatus } from '../shared/types'

type IncidentContextValue = {
  incidents: Incident[]
  activeIncidentId: string | null
  wsConnected: boolean
  addIncident: (incident: Incident) => void
  viewIncident: (id: string) => void
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>
  refreshIncidents: () => Promise<void>
}

const IncidentContext = createContext<IncidentContextValue | null>(null)

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  // Hydrate from the backend on first mount. The backend is the source of
  // truth — localStorage is only used as a fast cache for the initial render.
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    api.get<Incident[]>('/api/v1/incidents')
      .then(setIncidents)
      .catch(() => {
        // Backend unreachable — incidents stay empty until WS or manual refresh.
      })
  }, [])

  // WebSocket upsert: when the server broadcasts an incident on /topic/incidents,
  // either replace it in the array (status/severity changed) or prepend it
  // (new incident).
  const handleWsUpdate = useCallback((incident: Incident) => {
    setIncidents((current) => {
      const idx = current.findIndex((i) => i.id === incident.id)
      if (idx !== -1) {
        const next = [...current]
        next[idx] = incident
        return next
      }
      return [incident, ...current]
    })
  }, [])

  const { connected: wsConnected } = useWebSocket(handleWsUpdate)

  /** Re-fetches the full incident list from the backend. */
  const refreshIncidents = useCallback(async () => {
    try {
      const data = await api.get<Incident[]>('/api/v1/incidents')
      setIncidents(data)
    } catch {
      // Silently fail — WebSocket will keep pushing updates.
    }
  }, [])

  /** Inserts an incident returned by the backend POST into local state. */
  const addIncident = useCallback((incident: Incident) => {
    setIncidents((current) => [incident, ...current])
    setActiveIncidentId(incident.id)
  }, [])

  const viewIncident = useCallback((id: string) => {
    setActiveIncidentId(id)
  }, [])

  /**
   * Advances an incident's status via the backend REST API. The server
   * broadcasts the update over WebSocket, so all connected clients
   * (reporters + responders) see the change in real-time.
   */
  const updateIncidentStatus = useCallback(
    async (id: string, status: IncidentStatus) => {
      await api.patch<Incident>(`/api/v1/incidents/${id}/status`, { status })
      // The WebSocket broadcast will handle the state update for all clients.
      // For the calling client (which may not be subscribed yet), also
      // update locally as a fallback.
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === id ? { ...incident, status } : incident,
        ),
      )
    },
    [],
  )

  const value = useMemo<IncidentContextValue>(
    () => ({
      incidents,
      activeIncidentId,
      wsConnected,
      addIncident,
      viewIncident,
      updateIncidentStatus,
      refreshIncidents,
    }),
    [
      incidents,
      activeIncidentId,
      wsConnected,
      addIncident,
      viewIncident,
      updateIncidentStatus,
      refreshIncidents,
    ],
  )

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIncidents(): IncidentContextValue {
  const value = useContext(IncidentContext)
  if (!value) {
    throw new Error('useIncidents must be used inside an IncidentProvider')
  }
  return value
}
