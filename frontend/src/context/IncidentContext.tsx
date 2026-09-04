import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { incidentTitle } from '../lib/incidentTitle'
import type { Incident, IncidentStatus, SubmitIncidentPayload } from '../shared/types'

const STORAGE_KEY = 'uer_incidents'

type IncidentContextValue = {
  incidents: Incident[]
  activeIncidentId: string | null
  wsConnected: boolean
  submitIncident: (payload: SubmitIncidentPayload) => Incident
  viewIncident: (id: string) => void
  updateIncidentStatus: (id: string, status: IncidentStatus) => void
  refreshIncidents: () => void
}

const IncidentContext = createContext<IncidentContextValue | null>(null)

let sequence = 0

/** Builds a stable, human-friendly incident id for the current session. */
function nextIncidentId(): string {
  sequence += 1
  return `INC-2026-${String(890 + sequence).padStart(3, '0')}`
}

/**
 * Reads the persisted incidents array from localStorage. Falls back to an
 * empty array when nothing is stored or the value is not valid JSON.
 */
function readStoredIncidents(): Incident[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Incident[]) : []
  } catch {
    return []
  }
}

export function IncidentProvider({ children }: { children: ReactNode }) {
  // Hydrated from localStorage so a refreshed tab (or a second tab) sees the
  // same shared, session-spanning list. New reports are prepended so the most
  // recent sits at the top of the list.
  const [incidents, setIncidents] = useState<Incident[]>(readStoredIncidents)
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)

  // Persist the full array whenever it changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents))
    } catch {
      // Store is full or unavailable; data stays valid in memory for this tab.
    }
  }, [incidents])

  // Re-read from storage when another tab writes to the same key. This is the
  // mechanism that lets a Responder tab and a Reporter tab observe each
  // other's writes live, with no backend involved.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setIncidents(readStoredIncidents())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // WebSocket upsert: when the server broadcasts an incident on /topic/incidents,
  // either replace it in the array (status/severity changed) or prepend it
  // (new incident). This replaces localStorage as the real-time sync channel.
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

  const refreshIncidents = useCallback(() => {
    setIncidents(readStoredIncidents())
  }, [])

  const submitIncident = useCallback((payload: SubmitIncidentPayload) => {
    const incident: Incident = {
      id: nextIncidentId(),
      type: incidentTitle(payload.tagged),
      location: 'Location pending...',
      locationText: payload.locationText ?? '',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Reported' as IncidentStatus,
      tagged: payload.tagged,
      severity: 'medium',
      text: payload.text,
      images: payload.images ?? [],
    }

    setIncidents((current) => [incident, ...current])
    setActiveIncidentId(incident.id)
    return incident
  }, [])

  const viewIncident = useCallback((id: string) => {
    setActiveIncidentId(id)
  }, [])

  /**
   * Advances an incident's status (e.g. Reported -> En Route -> Resolved).
   * Persisted through the same incidents state, so the Reporter's Tracking
   * screen reflects the change live via its STEP_COUNT timeline logic.
   */
  const updateIncidentStatus = useCallback(
    (id: string, status: IncidentStatus) => {
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
      submitIncident,
      viewIncident,
      updateIncidentStatus,
      refreshIncidents,
    }),
    [
      incidents,
      activeIncidentId,
      wsConnected,
      submitIncident,
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
