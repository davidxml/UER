import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlertIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'

export default function ResponderLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }
    setSubmitting(true)
    try {
      await login(email.trim(), password, ['RESPONDER'])
      navigate('/dashboard', { replace: true })
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
          <p className="mt-2 text-sm text-ink-muted">
            Your unit is assigned by an administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="responder-email" className="text-sm font-semibold text-unilag-maroon">
              Email
            </label>
            <input
              id="responder-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              placeholder="name@unit.unilag.edu"
              className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="responder-password" className="text-sm font-semibold text-unilag-maroon">
              Password
            </label>
            <input
              id="responder-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none focus:border-unilag-maroon"
            />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-unilag-maroon py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

