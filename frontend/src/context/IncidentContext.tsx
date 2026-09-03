import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { incidentTitle } from '../lib/incidentTitle'

export type IncidentStatus = 'Reported' | 'En Route' | 'Resolved'

export type Incident = {
  id: string
  type: string
  location: string
  time: string
  status: IncidentStatus
  tagged: string
  severity: 'high' | 'medium' | 'low'
  text: string
  images: string[]
}

type IncidentContextValue = {
  incidents: Incident[]
  activeIncidentId: string | null
  submitIncident: (payload: {
    text: string
    tagged: string
    images?: string[]
  }) => Incident
  viewIncident: (id: string) => void
}

const IncidentContext = createContext<IncidentContextValue | null>(null)

let sequence = 0

/** Builds a stable, human-friendly incident id for the current session. */
function nextIncidentId(): string {
  sequence += 1
  return `INC-2026-${String(890 + sequence).padStart(3, '0')}`
}

export function IncidentProvider({ children }: { children: ReactNode }) {
  // Session-only: nothing is persisted or fetched from a server.
  // New reports are prepended so the most recent sits at the top of the list.
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)

  const submitIncident = useCallback(
    (payload: { text: string; tagged: string; images?: string[] }) => {
      const incident: Incident = {
        id: nextIncidentId(),
        type: incidentTitle(payload.tagged),
        location: 'Location pending...',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'Reported',
        tagged: payload.tagged,
        severity: 'medium',
        text: payload.text,
        images: payload.images ?? [],
      }

      setIncidents((current) => [incident, ...current])
      setActiveIncidentId(incident.id)
      return incident
    },
    [],
  )

  const viewIncident = useCallback((id: string) => {
    setActiveIncidentId(id)
  }, [])

  const value = useMemo<IncidentContextValue>(
    () => ({ incidents, activeIncidentId, submitIncident, viewIncident }),
    [incidents, activeIncidentId, submitIncident, viewIncident],
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
