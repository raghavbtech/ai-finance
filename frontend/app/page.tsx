'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

export default function LandingPage() {
  const router = useRouter()
  const [loadingDemo, setLoadingDemo] = useState(false)

  const handleDemo = async () => {
    setLoadingDemo(true)
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        router.push('/dashboard')
        return
      }
      const res = await api.post('/login/', { username: 'demo', password: 'demo123' })
      localStorage.setItem('access_token', res.data.access)
      router.push('/dashboard')
    } catch {
      router.push('/login')
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-semibold text-lg">FinSight AI</span>
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Login
          </button>
          <button
            onClick={handleDemo}
            disabled={loadingDemo}
            className="text-sm bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loadingDemo ? 'Loading...' : 'Try Demo'}
          </button>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-8 pt-20 pb-14">
        <h1 className="text-5xl font-bold leading-tight text-gray-900 max-w-xl mb-5">
          Financial analysis,<br />powered by ML
        </h1>
        <p className="text-gray-500 text-base max-w-lg leading-relaxed mb-8">
          FinSight trains Linear Regression and Random Forest models on your transactions,
          compares how they perform, and shows you the results through simple charts.
          Built to understand how different algorithms read the same data.
        </p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push('/login')}
            className="bg-gray-900 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-md text-sm transition-colors"
          >
            Get started
          </button>
          <button
            onClick={handleDemo}
            disabled={loadingDemo}
            className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors disabled:opacity-50"
          >
            {loadingDemo ? 'Loading...' : 'View live demo'}
          </button>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-5xl mx-auto" />

      <section className="max-w-5xl mx-auto px-8 py-14 grid md:grid-cols-2 gap-14">
        <div>
          <h2 className="text-xl font-semibold mb-3">What it does</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            You upload your bank data as a CSV. The app runs it through both models, scores each one
            using MAE, MSE and R², and lets you see where they agree or diverge on predictions.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            It also runs an Isolation Forest to flag any transactions that look out of the ordinary —
            useful for catching weird spending spikes or data entry errors.
          </p>
        </div>
        <div className="pt-1">
          <p className="text-sm font-medium text-gray-700 mb-3">What's included</p>
          <div className="space-y-3 text-sm text-gray-500">
            <p>— Anomaly detection on all transactions</p>
            <p>— Spending forecast for the next period</p>
            <p>— Side-by-side model accuracy scores</p>
            <p>— CSV import from any bank statement</p>
            <p>— Dashboard with category breakdowns</p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-5xl mx-auto" />

      <section className="max-w-5xl mx-auto px-8 py-14">
        <h2 className="text-xl font-semibold mb-1">Models</h2>
        <p className="text-gray-400 text-sm mb-8">Both trained on the same data, evaluated separately.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900 text-sm">Linear Regression</p>
              <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Baseline</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Simple and fast. Works well for month-over-month trends where spending
              follows a roughly predictable pattern.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900 text-sm">Random Forest</p>
              <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Ensemble</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Better at picking up irregular patterns — seasonal spikes, category shifts,
              or anything that doesn't follow a straight line.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-5xl mx-auto" />

      <section className="max-w-5xl mx-auto px-8 py-14">
        <h2 className="text-xl font-semibold mb-8">How it works</h2>
        <div className="grid sm:grid-cols-5 gap-6 text-sm">
          <div>
            <p className="text-2xl font-bold text-gray-100 mb-1">1</p>
            <p className="font-medium text-gray-800 mb-1">Upload</p>
            <p className="text-gray-400 text-xs">Drop in a CSV from your bank or add transactions manually.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100 mb-1">2</p>
            <p className="font-medium text-gray-800 mb-1">Preprocess</p>
            <p className="text-gray-400 text-xs">Data gets cleaned, normalized, and split for training.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100 mb-1">3</p>
            <p className="font-medium text-gray-800 mb-1">Train</p>
            <p className="text-gray-400 text-xs">Both models train on your data independently.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100 mb-1">4</p>
            <p className="font-medium text-gray-800 mb-1">Evaluate</p>
            <p className="text-gray-400 text-xs">Results compared using MAE, MSE and R² scores.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100 mb-1">5</p>
            <p className="font-medium text-gray-800 mb-1">Explore</p>
            <p className="text-gray-400 text-xs">View predictions, anomalies, and charts on the dashboard.</p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 max-w-5xl mx-auto" />

      <section className="max-w-5xl mx-auto px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="font-semibold text-gray-900 mb-1">Want to try it?</p>
          <p className="text-gray-400 text-sm">The demo account has sample data preloaded.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-gray-900 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-md text-sm transition-colors"
          >
            Create account
          </button>
          <button
            onClick={handleDemo}
            disabled={loadingDemo}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            {loadingDemo ? 'Loading...' : 'Open demo →'}
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-8 py-5 max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
        <span>FinSight AI</span>
        <span>Raghav Chugh · B.Tech AI</span>
      </footer>

    </main>
  )
}
