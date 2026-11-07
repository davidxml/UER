import type { AuthSession } from '../shared/auth'
import {
  clearSession,
  isAccessTokenExpiring,
  readSession,
  saveSession,
} from './authStorage'

/**
 * Thin fetch wrapper for the Spring Boot backend. In dev, requests go through
 * the Vite proxy (`/api` → `:8080`). In production, VITE_API_URL points to the
 * deployed backend.
 *
 * Auth flow:
 * - read the current session from localStorage and attach its access token;
 * - on a 401, refresh once (single-flight), save the rotated pair, retry;
 * - if the refresh is rejected, clear the session so AuthContext signs out.
 */
const BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

type RequestOptions = RequestInit & {
  /** Skip the Authorization header and the refresh-on-401 flow. */
  skipAuth?: boolean
  /** Internal: set after one refresh attempt so we never loop. */
  retry?: boolean
}

let refreshing: Promise<AuthSession | null> | null = null

async function performRefresh(current: AuthSession): Promise<AuthSession | null> {
  try {
    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })

    if (!res.ok) {
      // A rejected refresh token is terminal. A 5xx is not: keep the session so
      // the user can retry once the backend recovers.
      if (res.status >= 400 && res.status < 500) clearSession()
      return null
    }

    let next: AuthSession
    try {
      next = (await res.json()) as AuthSession
    } catch {
      clearSession()
      return null
    }

    // Defensive: never persist a half-issued session.
    if (!next?.accessToken || !next?.refreshToken) {
      clearSession()
      return null
    }

    saveSession(next)
    return next
  } catch {
    // Network failure — keep the session for the next attempt.
    return null
  }
}

/**
 * Runs the refresh inside a cross-tab lock. ``previousRefreshToken`` is the
 * token the caller tried to use. If it no longer matches storage, another tab
 * already rotated the session while this request was in flight, so reuse the
 * replacement instead of rotating again.
 */
async function refreshWithLock(
  previousRefreshToken?: string,
): Promise<AuthSession | null> {
  const run = async (): Promise<AuthSession | null> => {
    const current = readSession()
    if (!current) return null
    if (previousRefreshToken && current.refreshToken !== previousRefreshToken) {
      return current
    }
    return performRefresh(current)
  }

  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  return locks ? locks.request('uer:refresh', run) : run()
}

/**
 * Refreshes the session at most once at a time. Several requests can receive a
 * 401 together; without this shared promise they would rotate the same refresh
 * token repeatedly, and the backend would treat the extra rotations as reuse
 * and revoke the whole family.
 */
export function refreshSession(
  previousRefreshToken?: string,
): Promise<AuthSession | null> {
  if (!refreshing) {
    refreshing = refreshWithLock(previousRefreshToken).finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

/**
 * Returns a bearer token that is not about to expire. Used by the WebSocket
 * client before each CONNECT/reconnect; normal HTTP requests use the lazy
 * refresh-on-401 path instead.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const session = readSession()
  if (!session) return null

  if (!isAccessTokenExpiring(session.accessToken)) {
    return session.accessToken
  }

  const next = await refreshSession(session.refreshToken)
  return next?.accessToken ?? null
}

async function request<T>(
  path: string,
  init: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, retry = false, headers, ...rest } = init
  const session = readSession()
  const requestHeaders = new Headers(headers)

  if (rest.body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (!skipAuth && session?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: requestHeaders,
  })

  if (res.status === 401 && !skipAuth && !retry) {
    const next = await refreshSession(session?.refreshToken)
    if (next) {
      return request<T>(path, { ...init, retry: true })
    }
  }

  // Logout returns 204; there is no JSON body to parse.
  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T = unknown>(path: string, init?: RequestOptions) =>
    request<T>(path, init),

  post: <T = unknown>(path: string, body?: unknown, init?: RequestOptions) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T = unknown>(path: string, body: unknown, init?: RequestOptions) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(path: string, init?: RequestOptions) =>
    request<T>(path, { ...init, method: 'DELETE' }),
}
