/**
 * Thin fetch wrapper for the Spring Boot backend. In dev, requests go through
 * the Vite proxy (`/api` → `:8080`). In production, VITE_API_URL points to
 * the deployed backend.
 */
const BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.message ?? `Request failed: ${res.status}`
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),

  post: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
