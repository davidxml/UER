import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import UerLogo from '../assets/uer-logo.svg'

const PIN_LENGTH = 4

export default function Auth() {
  const [matricNumber, setMatricNumber] = useState('')
  const [pin, setPin] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/home')
  }

  return (
    <main className="flex min-h-svh w-full flex-col justify-center bg-cream px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <img
          src={UerLogo}
          alt="UER"
          className="mx-auto mb-10 h-16 w-16"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="matric-number"
              className="text-sm font-semibold text-wine"
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
              className="h-14 w-full rounded-xl border-2 border-wine bg-cream px-4 text-base text-ink outline-none placeholder:text-muted focus:border-wine-dark focus:ring-2 focus:ring-wine/25"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="pin" className="text-sm font-semibold text-wine">
              4-Digit PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH),
                )
              }
              required
              minLength={PIN_LENGTH}
              maxLength={PIN_LENGTH}
              autoComplete="off"
              className="h-14 w-full rounded-xl border-2 border-wine bg-cream px-4 text-base tracking-[0.5em] text-ink outline-none focus:border-wine-dark focus:ring-2 focus:ring-wine/25"
            />
          </div>

          <button
            type="submit"
            className="mt-3 h-14 w-full rounded-xl bg-wine text-base font-semibold text-cream active:bg-wine-dark"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  )
}
