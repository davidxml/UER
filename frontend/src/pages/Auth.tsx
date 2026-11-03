import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlertIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { isValidAcademicLevel, isValidMatric, normalizeMatric } from '../lib/matric'
import type { Gender } from '../shared/auth'

type Tab = 'login' | 'signup'

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

const LEVELS = [100, 200, 300, 400, 500, 600, 700, 800]

export default function Auth() {
  const [tab, setTab] = useState<Tab>('login')
  const navigate = useNavigate()
  const { login, signup } = useAuth()

  // Login
  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [matricNo, setMatricNo] = useState('')
  const [academicDepartment, setAcademicDepartment] = useState('')
  const [academicLevel, setAcademicLevel] = useState<number | ''>('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!loginId.trim() || !loginPassword) {
      setError('Enter your matric number/email and password')
      return
    }
    setSubmitting(true)
    try {
      await login(loginId.trim(), loginPassword, ['REPORTER'])
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const matric = normalizeMatric(matricNo)
    if (!displayName.trim()) return setError('Display name is required')
    if (!gender) return setError('Select your gender')
    if (!isValidMatric(matric)) {
      return setError('Matric number must be exactly 9 digits')
    }
    if (!academicDepartment.trim()) return setError('Academic department is required')
    if (academicLevel === '' || !isValidAcademicLevel(Number(academicLevel))) {
      return setError('Academic level must be between 100 and 800 in multiples of 100')
    }
    if (signupPassword.length < 8) return setError('Password must be at least 8 characters')
    if (signupPassword !== confirmPassword) return setError('Passwords do not match')

    setSubmitting(true)
    try {
      await signup({
        displayName: displayName.trim(),
        gender,
        matricNo: matric,
        academicDepartment: academicDepartment.trim(),
        academicLevel: Number(academicLevel),
        password: signupPassword,
      })
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh w-full flex-col justify-center bg-surface-white px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <ShieldAlertIcon className="h-16 w-16 text-unilag-maroon" />
        </div>

        <div className="mb-6 flex rounded-lg bg-surface-gray p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError('')
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              tab === 'login'
                ? 'bg-unilag-maroon text-white'
                : 'text-ink-muted'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup')
              setError('')
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              tab === 'signup'
                ? 'bg-unilag-maroon text-white'
                : 'text-ink-muted'
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="loginId" className="text-sm font-semibold text-unilag-maroon">
                Matric Number
              </label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value.toUpperCase())}
                required
                autoComplete="username"
                placeholder="e.g. 210201001"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="loginPassword" className="text-sm font-semibold text-unilag-maroon">
                Password
              </label>
              <input
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
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
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-sm font-semibold text-unilag-maroon">
                Full Name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                placeholder="e.g. John Doe"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-sm font-semibold text-unilag-maroon">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(event) => setGender(event.target.value as Gender)}
                required
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none focus:border-unilag-maroon"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="matricNo" className="text-sm font-semibold text-unilag-maroon">
                Matric Number
              </label>
              <input
                id="matricNo"
                inputMode="numeric"
                pattern="[0-9]*"
                value={matricNo}
                onChange={(event) => setMatricNo(normalizeMatric(event.target.value))}
                required
                placeholder="e.g. 210201001"
                maxLength={9}
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
              />
              <p className="text-xs text-ink-muted">9 digits. Entry year must be within the last 8 years.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="academicDepartment" className="text-sm font-semibold text-unilag-maroon">
                Academic Department
              </label>
              <input
                id="academicDepartment"
                value={academicDepartment}
                onChange={(event) => setAcademicDepartment(event.target.value)}
                required
                placeholder="e.g. Computer Science"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="academicLevel" className="text-sm font-semibold text-unilag-maroon">
                Academic Level
              </label>
              <select
                id="academicLevel"
                value={academicLevel}
                onChange={(event) => setAcademicLevel(Number(event.target.value))}
                required
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none focus:border-unilag-maroon"
              >
                <option value="">Select level</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="signupPassword" className="text-sm font-semibold text-unilag-maroon">
                Password
              </label>
              <input
                id="signupPassword"
                type="password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none focus:border-unilag-maroon"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-unilag-maroon">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="h-14 w-full rounded-lg border border-gray-300 bg-surface-white px-4 text-base text-ink-main outline-none focus:border-unilag-maroon"
              />
            </div>

            {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-unilag-maroon py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

