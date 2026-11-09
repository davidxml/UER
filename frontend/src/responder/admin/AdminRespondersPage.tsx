import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminApi, type CreateResponderPayload } from '../../lib/adminApi'
import { DEPARTMENTS } from '../../shared/constants'
import type { AuthUser } from '../../shared/auth'

type FormState = {
  displayName: string
  loginId: string
  unit: string
  phoneNumber: string
  password: string
}

const initialForm: FormState = {
  displayName: '',
  loginId: '',
  unit: '',
  phoneNumber: '',
  password: '',
}

export default function AdminRespondersPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [responders, setResponders] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadResponders = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await adminApi.listResponders()
      setResponders(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load responders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // Defer state updates to avoid react-hooks/set-state-in-effect.
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setLoadError('')
      try {
        const data = await adminApi.listResponders()
        if (!cancelled) setResponders(data)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load responders')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const unitOptions = useMemo(() => [...DEPARTMENTS], [])

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormError('')
    setFormSuccess('')
  }

  const validate = (): string | null => {
    if (form.displayName.trim().length < 2) return 'Name must be at least 2 characters.'
    if (!form.loginId.trim()) return 'Staff email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.loginId.trim())) {
      return 'Enter a valid staff email address.'
    }
    if (!form.unit) return 'Select the department/unit they work for.'
    if (form.password.length < 12) return 'Password must be at least 12 characters.'
    return null
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload: CreateResponderPayload = {
      displayName: form.displayName,
      loginId: form.loginId,
      unit: form.unit,
      phoneNumber: form.phoneNumber || undefined,
      password: form.password,
    }

    setSubmitting(true)
    try {
      await adminApi.createResponder(payload)
      setForm(initialForm)
      setFormSuccess('Responder account created successfully.')
      await loadResponders()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create responder')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEnabled = async (responder: AuthUser) => {
    if (busyId) return
    const nextEnabled = !responder.enabled
    if (!nextEnabled) {
      const ok = window.confirm(
        `Disable ${responder.displayName}? They will be signed out and unable to log in.`,
      )
      if (!ok) return
    }
    setBusyId(responder.id)
    try {
      await adminApi.setResponderEnabled(responder.id, nextEnabled)
      await loadResponders()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to update responder')
    } finally {
      setBusyId(null)
    }
  }

  const handleSignOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-surface-gray">
      <header className="border-b border-gray-200 bg-surface-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-unilag-maroon">Admin Console</h1>
            <p className="text-sm text-ink-muted">
              Signed in as {user?.displayName || user?.loginId || 'Admin'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-ink-main hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-xl border border-gray-200 bg-surface-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-unilag-maroon">Create Responder</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Responder accounts can only be created by admins.
          </p>

          <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="displayName" className="text-sm font-semibold text-unilag-maroon">
                Full name
              </label>
              <input
                id="displayName"
                value={form.displayName}
                onChange={(e) => onChange('displayName', e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-unilag-maroon"
                placeholder="e.g. Dr. Amina Yusuf"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="loginId" className="text-sm font-semibold text-unilag-maroon">
                Staff email address
              </label>
              <input
                id="loginId"
                type="email"
                value={form.loginId}
                onChange={(e) => onChange('loginId', e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-unilag-maroon"
                placeholder="name@unit.unilag.edu.ng"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="unit" className="text-sm font-semibold text-unilag-maroon">
                Department / Unit
              </label>
              <select
                id="unit"
                value={form.unit}
                onChange={(e) => onChange('unit', e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-unilag-maroon"
              >
                <option value="">Select unit</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="text-sm font-semibold text-unilag-maroon">
                Official phone number <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="phoneNumber"
                value={form.phoneNumber}
                onChange={(e) => onChange('phoneNumber', e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-unilag-maroon"
                placeholder="+234..."
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-unilag-maroon">
                Temporary password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-unilag-maroon"
                placeholder="Minimum 12 characters"
                autoComplete="new-password"
              />
            </div>

            {formError && <p className="text-sm font-medium text-status-danger">{formError}</p>}
            {formSuccess && <p className="text-sm font-medium text-green-700">{formSuccess}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-lg bg-unilag-maroon py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Responder'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-surface-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-unilag-maroon">Responders</h2>
            <button
              type="button"
              onClick={() => void loadResponders()}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink-main hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-ink-muted">Loading responders…</p>
          ) : loadError ? (
            <p className="mt-4 text-sm font-medium text-status-danger">{loadError}</p>
          ) : responders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No responders yet. Create one using the form.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-ink-muted">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Email</th>
                    <th className="py-2 pr-3 font-semibold">Unit</th>
                    <th className="py-2 pr-3 font-semibold">Phone</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {responders.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 align-top">
                      <td className="py-3 pr-3 font-medium text-ink-main">{r.displayName}</td>
                      <td className="py-3 pr-3 text-ink-main">{r.loginId}</td>
                      <td className="py-3 pr-3 text-ink-main">{r.department || '—'}</td>
                      <td className="py-3 pr-3 text-ink-main">{r.phoneNumber || '—'}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={
                            r.enabled
                              ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800'
                              : 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800'
                          }
                        >
                          {r.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void handleToggleEnabled(r)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-ink-main hover:bg-gray-50 disabled:opacity-50"
                        >
                          {busyId === r.id ? 'Saving…' : r.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
