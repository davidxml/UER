import UerLogo from '../assets/uer-logo.svg'

export default function SplashScreen() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-[#FDFBF7] font-sans text-[#911634]">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <img
          src={UerLogo}
          alt="UER Atomic Logo"
          className="h-32 w-32 animate-pulse md:h-40 md:w-40 motion-reduce:animate-none"
        />

        <h1 className="mt-4 text-4xl font-extrabold uppercase tracking-widest md:text-5xl">
          UER
        </h1>
      </div>

      <div className="absolute bottom-8 flex w-full justify-center px-4 md:bottom-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide md:text-lg">
          University of Lagos Emergency Response
        </h2>
      </div>
    </div>
  )
} 