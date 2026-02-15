import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-white">PRYTHIA</span>
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed">
          Prediction Market Intelligence Platform.
          Real-time aggregated probabilities, AI analysis, and alerts
          across Polymarket, Kalshi, and Metaculus.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/feed"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-slate-950 hover:bg-slate-200 transition-colors"
          >
            Open Dashboard
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-white hover:bg-slate-900 transition-colors"
          >
            Create Account
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Two products, one data layer. Dashboard for analysts. API for quant funds.
        </p>
      </div>
    </div>
  )
}
