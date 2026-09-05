/**
 * Shared domain constants for the UER frontend. Centralised so the Reporter
 * creator and the Responder dispatch screens never drift apart on the set of
 * emergency units.
 */
export const DEPARTMENTS = [
  'Alpha Base',
  'Medical Center',
  'Fire Station',
] as const

export type Department = (typeof DEPARTMENTS)[number]
