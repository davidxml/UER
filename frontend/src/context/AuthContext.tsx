import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'uer_auth'

/**
 * Shape persisted to localStorage. Deliberately the matric number only —
 * the PIN is never written to storage, and there is nothing else the
 * prototype needs in order to restore a session.
 */
type StoredAuth = {
  matricNumber: string
}

type AuthState = {
  isAuthenticated: boolean
  isGuest: boolean
  matricNumber: string | null
}

type AuthContextValue = AuthState & {
  isHydrated: boolean
  login: (matricNumber: string) => void
  loginAsGuest: () => void
  logout: () => void
}

const SIGNED_OUT: AuthState = {
  isAuthenticated: false,
  isGuest: false,
  matricNumber: null,
}

/**
 * Restores the stored session. Read synchronously (see AuthProvider) so the
 * very first render already reflects storage and a guarded route can never
 * observe a false "signed out".
 */
function readStoredAuth(): AuthState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return SIGNED_OUT

    const parsed: unknown = JSON.parse(raw)
    const matricNumber = (parsed as StoredAuth | null)?.matricNumber

    // Treat anything unexpected as signed out rather than trusting it: the
    // value is user-writable via devtools.
    if (typeof matricNumber !== 'string' || matricNumber.trim() === '') {
      return SIGNED_OUT
    }

    return { isAuthenticated: true, isGuest: false, matricNumber }
  } catch {
    // Storage unavailable (Safari private mode, disabled by policy) or the
    // stored value is not valid JSON.
    return SIGNED_OUT
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initialiser: localStorage is synchronous, so hydration completes
  // before the first paint. This removes the redirect race by construction
  // rather than gating the first render behind a loading flag.
  const [state, setState] = useState<AuthState>(readStoredAuth)

  const login = useCallback((matricNumber: string) => {
    const normalised = matricNumber.trim().toUpperCase()
    setState({ isAuthenticated: true, isGuest: false, matricNumber: normalised })

    try {
      const payload: StoredAuth = { matricNumber: normalised }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Session stays valid for this tab even if it cannot be persisted.
    }
  }, [])

  // Guest bypass: reach the reporter flow without signing in. Kept in memory
  // only — a guest has no matric number to persist, and a refreshed tab that
  // had no real session should return to the auth screen.
  const loginAsGuest = useCallback(() => {
    setState({ isAuthenticated: true, isGuest: true, matricNumber: null })
  }, [])

  const logout = useCallback(() => {
    setState(SIGNED_OUT)

    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to recover from; in-memory state is already cleared.
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      // True from the first render because hydration is synchronous. Guards
      // still check it, so the precondition stays explicit and they remain
      // correct if restoring a session ever becomes asynchronous.
      isHydrated: true,
      login,
      loginAsGuest,
      logout,
    }),
    [state, login, loginAsGuest, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Colocated with its provider on purpose: a context, its provider and its
// consumer hook are one unit, and splitting them only to satisfy an HMR
// heuristic would cost more in readability than it saves in refresh speed.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return value
}
