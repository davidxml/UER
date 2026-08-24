import { useEffect, useState } from 'react'
import SplashScreen from './components/SplashScreen'
import './App.css'

const SPLASH_FADE_MS = 3200
const SPLASH_EXIT_MS = 4000

function App() {
  const [phase, setPhase] = useState<'splash' | 'fading' | 'home'>('splash')

  useEffect(() => {
    const fadeTimer = window.setTimeout(
      () => setPhase('fading'),
      SPLASH_FADE_MS,
    )
    const exitTimer = window.setTimeout(() => setPhase('home'), SPLASH_EXIT_MS)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(exitTimer)
    }
  }, [])

  if (phase === 'home') {
    return (
      <main className="home">
        <div className="home-card">
          <h1>Welcome to UER</h1>
          <p>Your Everyday Remedy</p>
        </div>
      </main>
    )
  }

  return (
    <div className={`splash-shell ${phase === 'fading' ? 'is-fading' : ''}`}>
      <SplashScreen />
    </div>
  )
}

export default App
