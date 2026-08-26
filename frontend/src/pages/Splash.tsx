import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SplashScreen from '../components/SplashScreen'

const SPLASH_FADE_MS = 2600
const SPLASH_EXIT_MS = 3000

/**
 * Route wrapper for the existing SplashScreen component.
 * Owns only the timing + navigation; the splash visuals are untouched.
 */
export default function Splash() {
  const [isFading, setIsFading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsFading(true), SPLASH_FADE_MS)
    const exitTimer = window.setTimeout(
      () => navigate('/auth', { replace: true }),
      SPLASH_EXIT_MS,
    )
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(exitTimer)
    }
  }, [navigate])

  return (
    <div className={`splash-shell ${isFading ? 'is-fading' : ''}`}>
      <SplashScreen />
    </div>
  )
}
