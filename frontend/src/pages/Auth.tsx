import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlertIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [matricNumber, setMatricNumber] = useState('')
  const navigate = useNavigate()
  const { login, loginAsGuest } = useAuth()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!matricNumber.trim()) return

    login(matricNumber)
    // Replace so Back cannot land on a login form that would bounce back.
    navigate('/home', { replace: true })
  }

  function handleGuestBypass() {
    // Guest reaches the reporting flow without a matric number. The session
    // is kept in memory only, so a refresh returns to this screen.
    loginAsGuest()
    navigate('/home', { replace: true })
  }

  return (
    <main className="flex min-h-svh w-full flex-col justify-center bg-surface-white px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <ShieldAlertIcon className="h-16 w-16 text-unilag-maroon" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="matric-number"
              className="text-sm font-semibold text-unilag-maroon"
            >
              Matric Number
            </label>
            <input
              id="matric-number"
              name="matricNumber"
              type="text"
              value={matricNumber}
              onChange={(event) =>
                setMatricNumber(event.target.value.toUpperCase())
              }
              required
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. 210201001"
              className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Your account is <span className="font-semibold">{matricNumber || '[matricno]'}</span>
              @live.unilag.edu
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-unilag-maroon py-3 font-semibold text-white hover:bg-unilag-maroon-dark"
          >
            Send OTP
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-gray-300" />
          <span className="text-sm font-bold uppercase tracking-wider text-unilag-maroon">
            OR EMERGENCIES ONLY
          </span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>

        <button
          type="button"
          onClick={handleGuestBypass}
          className="w-full rounded-lg border-2 border-unilag-maroon py-3 font-bold text-unilag-maroon"
        >
          Emergency Quick Report (No Sign-in)
        </button>
      </div>
    </main>
  )
}
