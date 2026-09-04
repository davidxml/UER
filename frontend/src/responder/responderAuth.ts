import type { Department } from '../shared/constants'

const STORAGE_KEY = 'uer_responder_auth'

/**
 * Reads the persisted responder session (active department). Synchronous like
 * the Reporter's AuthContext, so a guard can decide on the first render with
 * no hydration race. Returns null when signed out or the value is malformed.
 */
export function readResponderSession(): Department | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const department = (parsed as { department?: Department } | null)?.department
    if (typeof department !== 'string' || department.trim() === '') return null
    return department
  } catch {
    return null
  }
}

export function saveResponderSession(department: Department): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ department }))
  } catch {
    // Fall through; the in-memory UI stays correct for this tab.
  }
}

export function clearResponderSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore; nothing to recover from.
  }
}
