import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import {
  clearSession,
  readSession,
  saveSession,
  subscribeSession,
} from '../lib/authStorage'
import type { AuthSession, AuthUser, Role, StudentSignupPayload } from '../shared/auth'

type AuthContextValue = {
  session: AuthSession | null
  user: AuthUser | null
  isAuthenticated: boolean
  /** True once the session has been read from storage. */
  isHydrated: boolean
  /** Log in with a login id (matric or email) and password. */
  login: (
    loginId: string,
    password: string,
    allowedRoles?: Role[],
  ) => Promise<void>
  /** Create a student account (always REPORTER). */
  signup: (payload: StudentSignupPayload) => Promise<void>
  /** Revoke the refresh token on the server and clear local state. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())
  const isHydrated = true

  // Keep in sync with localStorage: refresh rotations from api.ts, sign-out in
  // another tab, or a cleared session all update this context.
  useEffect(() => {
    return subscribeSession(() => {
      setSession(readSession())
    })
  }, [])

  const login = useCallback(
    async (loginId: string, password: string, allowedRoles?: Role[]) => {
      const id = loginId.trim()
      if (!id || !password) throw new Error('Login ID and password are required')

      const res = await api.post<AuthSession>(
        '/api/v1/auth/login',
        { loginId: id, password },
        { skipAuth: true },
      )

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(res.user.role)) {
          // Don't leave a session behind if the app rejects this role.
          try {
            await api.post(
              '/api/v1/auth/logout',
              { refreshToken: res.refreshToken },
              { skipAuth: true },
            )
          } catch {
            // Best effort only.
          }
          throw new Error('This account cannot access this application')
        }
      }

      saveSession(res)
      setSession(res)
    },
    [],
  )

  const signup = useCallback(async (payload: StudentSignupPayload) => {
    const res = await api.post<AuthSession>(
      '/api/v1/auth/register',
      {
        displayName: payload.displayName.trim(),
        gender: payload.gender,
        matricNo: payload.matricNo.trim(),
        academicDepartment: payload.academicDepartment.trim(),
        academicLevel: payload.academicLevel,
        password: payload.password,
      },
      { skipAuth: true },
    )
    saveSession(res)
    setSession(res)
  }, [])

  const logout = useCallback(async () => {
    const current = readSession()
    if (current?.refreshToken) {
      try {
        await api.post(
          '/api/v1/auth/logout',
          { refreshToken: current.refreshToken },
          { skipAuth: true },
        )
      } catch {
        // Server revoke failed (network/offline) — clear locally anyway.
      }
    }
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isHydrated,
      login,
      signup,
      logout,
    }),
    [session, isHydrated, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return value
}
