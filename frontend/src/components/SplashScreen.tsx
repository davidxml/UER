import './SplashScreen.css'

function HealthIcon() {
  return (
    <svg
      className="splash-icon-svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Health"
    >
      <path
        className="splash-heart"
        d="M32 56.5C11.5 42 4.5 30.5 4.5 20.8 4.5 12.6 10.9 6.5 18.7 6.5c5.4 0 9.9 2.9 13.3 7.9 3.4-5 7.9-7.9 13.3-7.9 7.8 0 14.2 6.1 14.2 14.3 0 9.7-7 21.2-27.5 35.7z"
      />
      <polyline
        className="splash-pulse"
        points="6 30 20 30 25 18 32 42 38 26 43 33 58 33"
        fill="none"
      />
    </svg>
  )
}

export default function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash-glow" aria-hidden="true" />

      <div className="splash-content">
        <div className="splash-icon">
          <HealthIcon />
        </div>
        <h1 className="splash-title">UER</h1>
        <p className="splash-subtitle">Your Everyday Remedy</p>
      </div>

      <div className="splash-wine" aria-hidden="true">
        <div className="splash-bubbles">
          <span /><span /><span /><span /><span /><span />
        </div>

        <svg
          className="splash-wave splash-wave-back"
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
        >
          <path d="M0 80 C240 40 480 40 720 80 C960 120 1200 120 1440 80 C1680 40 1920 40 2160 80 C2400 120 2640 120 2880 80 L2880 160 L0 160 Z" />
        </svg>

        <svg
          className="splash-wave splash-wave-mid"
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
        >
          <path d="M0 90 C180 45 360 45 540 90 C720 135 900 135 1080 90 C1260 45 1440 45 1620 90 C1800 135 1980 135 2160 90 C2340 45 2520 45 2700 90 C2790 112.5 2835 101.5 2880 90 L2880 160 L0 160 Z" />
        </svg>

        <svg
          className="splash-wave splash-wave-front"
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
        >
          <path d="M0 100 C300 55 600 55 900 100 C1200 145 1500 145 1800 100 C2100 55 2400 55 2700 100 C2760 109 2820 118 2880 127 L2880 160 L0 160 Z" />
        </svg>
      </div>
    </div>
  )
}
