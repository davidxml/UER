/**
 * Shared contract for incidents across the UER frontend (Reporter and
 * Responder screens). Both sides operate on the same shape so data flowing
 * through localStorage/API stays consistent.
 */

export type IncidentStatus = 'Reported' | 'En Route' | 'Resolved'

export type SeverityLevel = 'high' | 'medium' | 'low'

export type Incident = {
  id: string
  type: string
  location: string
  locationText: string
  time: string
  status: IncidentStatus
  tagged: string
  severity: SeverityLevel
  text: string
  images: string[]
}

export type SubmitIncidentPayload = {
  text: string
  tagged: string
  locationText?: string
  images?: string[]
}
