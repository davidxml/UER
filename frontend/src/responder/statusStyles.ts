import type { IncidentStatus } from '../shared/types'

/** Tailwind classes for each incident status badge, using the @theme tokens. */
export const STATUS_BADGE: Record<IncidentStatus, string> = {
  Reported: 'bg-status-danger/15 text-status-danger',
  'En Route': 'bg-status-warning/20 text-status-warning',
  Resolved: 'bg-status-success/20 text-status-success',
}
