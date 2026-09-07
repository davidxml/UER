import { useState } from 'react'
import { ShieldAlertIcon } from '../components/icons'
import { api } from '../lib/api'
import { DEPARTMENTS } from '../shared/constants'
import type { Department } from '../shared/constants'
import type { ResponderSession } from './responderAuth'

type ResponderLoginProps = {
  onLogin: (session: ResponderSession) => void
}

/**
 * Responder credential entry: pick a unit then enter a PIN. The PIN is
 * verified against the backend (POST /api/v1/auth/responder/login), which
 * returns a JWT. That token is stored in the session and sent as a Bearer
 * header on every responder mutation.
 */
export default function ResponderLogin({ onLogin }: ResponderLoginProps) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!department) return
    setSubmitting(true)
    setError('')
    try {
      const { token } = await api.post<{ token: string }>(
        '/api/v1/auth/responder/login',
        { department, pin },
      )
      onLogin({ department, token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-surface-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center">
          <ShieldAlertIcon className="h-16 w-16 text-unilag-maroon" />
          <h1 className="mt-4 text-2xl font-bold text-unilag-maroon">
            Responder Sign In
          </h1>
        </div>

        {!department ? (
          <div className="flex flex-col gap-3">
            <p className="mb-2 text-sm font-semibold text-ink-muted">
              Select your unit
            </p>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartment(dept)}
                className="rounded-xl border-2 border-unilag-maroon py-3 font-bold text-unilag-maroon transition-colors hover:bg-unilag-maroon hover:text-surface-white"
              >
                {dept}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Signing in as</p>
                <p className="text-lg font-bold text-ink-main">{department}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDepartment(null)
                  setPin('')
                  setError('')
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-unilag-maroon hover:bg-surface-gray"
              >
                Change
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="responder-pin"
                className="text-sm font-semibold text-unilag-maroon"
              >
                Access PIN
              </label>
              <input
                id="responder-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setPin(digits)
                  setError('')
                }}
                placeholder="••••"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-center text-2xl tracking-[0.5em] text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-status-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={pin.length !== 4 || submitting}
              className="w-full rounded-lg bg-unilag-maroon py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
