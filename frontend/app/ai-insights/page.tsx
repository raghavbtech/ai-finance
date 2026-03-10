'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

type Anomaly = {
  id: number
  amount: number
  description: string
  category: string
  date: string
  reason: string
}

type PredictionData = {
  history: { month: string; total: number }[]
  predicted_next_month: number
  message: string
}

export default function AiInsightsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [anomalyError, setAnomalyError] = useState('')
  const [predictionError, setPredictionError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }

    Promise.all([
      api.get('/anomalies/').then(res => {
        if (res.data.error) setAnomalyError(res.data.error)
        else setAnomalies(res.data.anomalies)
      }).catch(() => setAnomalyError('Failed to load anomalies')),
      api.get('/predictions/').then(res => {
        if (res.data.error) setPredictionError(res.data.error)
        else setPrediction(res.data)
      }).catch(() => setPredictionError('Failed to load predictions')),
    ]).finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div className="flex min-h-screen bg-[#f5f4f0] dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-56 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f4f0] dark:bg-[#0f1117]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 bg-white dark:bg-[#13151f] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Finance</span>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Insights</h1>
            <p className="text-gray-400 text-sm mt-0.5">Machine learning powered financial analysis</p>
          </div>

          {/* Prediction */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6 mb-4 lg:mb-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Expense Prediction</h2>
            <p className="text-xs text-gray-400 mb-5">Linear Regression based on your monthly history</p>

            {predictionError ? (
              <p className="text-yellow-600 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-xl">{predictionError}</p>
            ) : prediction ? (
              <div>
                <div className="flex flex-wrap gap-2 lg:gap-3 mb-5">
                  {prediction.history.map(h => (
                    <div key={h.month} className="bg-gray-50 dark:bg-[#13151f] border border-gray-100 dark:border-gray-800 rounded-xl px-3 lg:px-4 py-3 text-sm">
                      <p className="text-gray-400 text-xs mb-1">{h.month}</p>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">₹{h.total.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 lg:px-4 py-3 text-sm">
                    <p className="text-blue-400 text-xs mb-1">Next Month</p>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">₹{prediction.predicted_next_month.toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl px-4 lg:px-5 py-4">
                  <p className="text-blue-100 text-xs mb-1">Prediction</p>
                  <p className="text-white font-semibold text-base lg:text-lg">{prediction.message}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Anomaly Detection</h2>
              {anomalies.length > 0 && (
                <span className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/30">
                  {anomalies.length} flagged
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-5">Unusual transactions flagged by Isolation Forest</p>

            {anomalyError ? (
              <p className="text-yellow-600 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-xl">{anomalyError}</p>
            ) : anomalies.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No unusual transactions detected
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {anomalies.map(a => (
                  <div key={a.id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate">{a.description}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{a.category} · {a.date}</p>
                      </div>
                      <p className="text-red-500 dark:text-red-400 font-bold text-sm whitespace-nowrap">₹{a.amount.toFixed(2)}</p>
                    </div>
                    <p className="text-red-400 text-xs mt-2">{a.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
