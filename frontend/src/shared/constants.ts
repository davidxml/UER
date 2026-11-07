/**
 * Shared domain constants for the UER frontend. Centralised so the Reporter
 * creator and the Responder dispatch screens never drift apart on the set of
 * emergency units.
 *
 * Must stay in sync with the backend's allowed responder units.
 */
export const DEPARTMENTS = [
  'Alpha Base',
  'Medical Center',
  'Fire Station',
  'General Dispatch',
] as const

export type Department = (typeof DEPARTMENTS)[number]
