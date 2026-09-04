import type { Department } from '../shared/constants'

const STORAGE_KEY = 'uer_responder_auth'

export type ResponderSession = {
  department: Department
  token: string
}

/**
 * Reads the persisted responder session (active department + JWT). Synchronous
 * like the Reporter's AuthContext, so a guard can decide on the first render
 * with no hydration race. Returns null when signed out or the value is malformed.
 */
export function readResponderSession(): ResponderSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const session = parsed as ResponderSession | null
    if (
      !session ||
      typeof session.department !== 'string' ||
      session.department.trim() === '' ||
      typeof session.token !== 'string' ||
      session.token.trim() === ''
    ) {
      return null
    }
    return session
  } catch {
    return null
  }
}

/** Returns just the department, if a session exists. */
export function readResponderDepartment(): Department | null {
  return readResponderSession()?.department ?? null
}

export function saveResponderSession(session: ResponderSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
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
