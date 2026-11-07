import { isRole } from '../shared/auth'
import type { AuthSession } from '../shared/auth'

const STORAGE_KEY = 'uer_session_v1'

/**
 * Refresh when the access token has less than this much life left. The access
 * token lives five minutes; the margin absorbs clock skew and slow networks.
 */
const ACCESS_TOKEN_SKEW_MS = 30_000

const listeners = new Set<() => void>()

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    // Storage can be disabled (Safari private mode, enterprise policy).
    return null
  }
}

function emit(): void {
  for (const listener of listeners) listener()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * Persisted session used by both apps. One key is enough because the reporter
 * and responder bundles are deployed on separate origins; a session is only
 * ever valid for one of them.
 *
 * Anything that does not look like an AuthSession is treated as signed out:
 * localStorage is user-writable through devtools, and a malformed value should
 * never crash a route guard.
 */
export function readSession(): AuthSession | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      !isNonEmptyString(parsed.accessToken) ||
      !isNonEmptyString(parsed.refreshToken) ||
      !isRecord(parsed.user) ||
      !isNonEmptyString(parsed.user.id) ||
      !isNonEmptyString(parsed.user.loginId) ||
      !isNonEmptyString(parsed.user.displayName) ||
      !isRole(parsed.user.role)
    ) {
      return null
    }

    return parsed as unknown as AuthSession
  } catch {
    // Malformed JSON or storage access denied.
    return null
  }
}

export function saveSession(session: AuthSession): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session))
    emit()
  } catch {
    // The current tab keeps working with the in-memory copy in AuthContext.
  }
}

export function clearSession(): void {
  const storage = getStorage()

  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to recover from; still notify listeners so the UI signs out.
  } finally {
    emit()
  }
}

/** Notifies subscribers whenever this tab (or another tab) changes the session. */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Reads the expiry from a JWT payload without verifying the signature.
 * Verification is the server's job; this is only a "should I refresh first?"
 * hint for the WebSocket reconnect path.
 */
function readJwtExpiry(token: string): number | null {
  const parts = token.split('.')
  if (parts.length < 2 || typeof atob === 'undefined') return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload: unknown = JSON.parse(atob(padded))

    if (!isRecord(payload) || typeof payload.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

/**
 * True when the token is missing, malformed, or close enough to expiry that a
 * caller should refresh before opening a long-lived connection. Unreadable
 * tokens count as expired so the caller refreshes once instead of retrying the
 * same broken token forever.
 */
export function isAccessTokenExpiring(
  token: string,
  skewMs = ACCESS_TOKEN_SKEW_MS,
): boolean {
  const expiresAt = readJwtExpiry(token)
  return expiresAt === null || expiresAt - skewMs <= Date.now()
}

// A session change in another tab should update this tab's AuthContext too.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) emit()
  })
}
