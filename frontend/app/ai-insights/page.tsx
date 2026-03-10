'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">AI Insights</h1>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
          <h2 className="text-white font-semibold mb-4">Expense Prediction</h2>
          {predictionError ? (
            <p className="text-yellow-400 text-sm">{predictionError}</p>
          ) : prediction ? (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                {prediction.history.map(h => (
                  <div key={h.month} className="bg-gray-800 rounded-lg px-4 py-2 text-sm">
                    <p className="text-gray-400">{h.month}</p>
                    <p className="text-white font-medium">₹{h.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-3">
                <p className="text-blue-300 font-semibold text-lg">{prediction.message}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-semibold">Anomaly Detection</h2>
            {anomalies.length > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {anomalies.length} flagged
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mb-4">Unusual transactions flagged by Isolation Forest</p>

          {anomalyError ? (
            <p className="text-yellow-400 text-sm">{anomalyError}</p>
          ) : anomalies.length === 0 ? (
            <p className="text-green-400 text-sm">No unusual transactions detected.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {anomalies.map(a => (
                <div key={a.id} className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{a.description}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{a.category} · {a.date}</p>
                    </div>
                    <p className="text-red-400 font-bold">₹{a.amount.toFixed(2)}</p>
                  </div>
                  <p className="text-red-300 text-xs mt-2">{a.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
