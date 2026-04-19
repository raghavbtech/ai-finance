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
  risk: string
  reason: string
}

type AnomalyResult = {
  anomalies_found: number
  high_risk: number
  medium_risk: number
  anomalies: Anomaly[]
  error?: string
}

type PredictionData = {
  history: { month: string; total: number }[]
  predicted_next_month: number
  message: string
}

type AdviceItem = {
  type: 'danger' | 'warning' | 'success' | 'info' | 'tip'
  message: string
}

type HealthScore = {
  score: number
  category: string
  reason: string
  savings_ratio: number
  emi_burden: number
  monthly_income: number
  monthly_expense: number
}

const riskColor: Record<string, string> = {
  High: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400',
  Medium: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/10 dark:border-orange-900/30 dark:text-orange-400',
  Low: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400',
}

const riskBadge: Record<string, string> = {
  High: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  Medium: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  Low: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const adviceStyle: Record<string, string> = {
  danger: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  warning: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
  success: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
  info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  tip: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
}

const adviceLabel: Record<string, string> = {
  danger: 'Alert',
  warning: 'Warning',
  success: 'Good',
  info: 'Info',
  tip: 'Tip',
}

const scoreColor = (score: number) =>
  score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'

export default function AiInsightsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [advice, setAdvice] = useState<AdviceItem[]>([])
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)

  const [predictionError, setPredictionError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }

    Promise.all([
      api.get('/ai/advisor/').then(res => setAdvice(res.data.advice)).catch(() => {}),
      api.get('/ai/anomalies/').then(res => setAnomalyResult(res.data)).catch(() => {}),
      api.get('/ai/health-score/').then(res => setHealthScore(res.data)).catch(() => {}),
      api.get('/predictions/').then(res => {
        if (res.data.error) setPredictionError(res.data.error)
        else setPrediction(res.data)
      }).catch(() => setPredictionError('Failed to load predictions')),
    ]).finally(() => setLoading(false))
  }, [router])

  if (loading) return (
    <div className="flex min-h-screen bg-white dark:bg-[#0f1117]">
      <Sidebar />
      <div className="flex-1 lg:ml-56 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0f1117]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        <div className="lg:hidden sticky top-0 z-10 bg-white dark:bg-[#13151f] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">FinSight AI</span>
        </div>

        <div className="p-4 lg:p-8 max-w-5xl">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Insights</h1>
            <p className="text-gray-400 text-sm mt-0.5">Intelligent financial analysis powered by machine learning</p>
          </div>

          {/* AI Advisor */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Financial Advisor</h2>
            <p className="text-xs text-gray-400 mb-4">Personalized recommendations based on your spending patterns</p>
            {advice.length === 0 ? (
              <p className="text-gray-400 text-sm">No data available yet. Add income and transactions to get advice.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {advice.map((item, i) => (
                  <div key={i} className={`border-l-4 px-4 py-3 rounded-r-md text-sm ${adviceStyle[item.type]}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide mr-2 opacity-60">{adviceLabel[item.type]}</span>
                    <span className="text-gray-800 dark:text-gray-200">{item.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Score */}
          {healthScore && (
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 p-5 mb-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Financial Health Score</h2>
              <p className="text-xs text-gray-400 mb-4">Composite score based on savings, EMI burden, consistency and anomalies</p>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={scoreColor(healthScore.score)}
                      strokeWidth="10"
                      strokeDasharray={`${(healthScore.score / 100) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="64" textAnchor="middle" fontSize="22" fontWeight="bold" fill={scoreColor(healthScore.score)}>
                      {healthScore.score}
                    </text>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{healthScore.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{healthScore.reason}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Savings Ratio</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{healthScore.savings_ratio}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">EMI Burden</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{healthScore.emi_burden}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgraded Anomaly Detection */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 p-5 mb-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fraud & Anomaly Detection</h2>
              {anomalyResult && !anomalyResult.error && anomalyResult.anomalies_found > 0 && (
                <div className="flex gap-2">
                  {anomalyResult.high_risk > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      {anomalyResult.high_risk} High
                    </span>
                  )}
                  {anomalyResult.medium_risk > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      {anomalyResult.medium_risk} Medium
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">Isolation Forest with risk levels and explanations</p>

            {!anomalyResult || anomalyResult.error ? (
              <p className="text-yellow-600 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-md">
                {anomalyResult?.error ?? 'Failed to load anomaly data'}
              </p>
            ) : anomalyResult.anomalies_found === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No unusual transactions detected
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {anomalyResult.anomalies.map(a => (
                  <div key={a.id} className={`border rounded-md px-4 py-3 ${riskColor[a.risk]}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{a.description}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${riskBadge[a.risk]}`}>
                            {a.risk}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{a.category} · {a.date}</p>
                      </div>
                      <p className="font-bold text-sm whitespace-nowrap">₹{a.amount.toFixed(2)}</p>
                    </div>
                    <p className="text-xs mt-2 opacity-80">{a.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Prediction */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Expense Prediction</h2>
            <p className="text-xs text-gray-400 mb-4">Linear Regression based on your monthly history</p>

            {predictionError ? (
              <p className="text-yellow-600 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-md">{predictionError}</p>
            ) : prediction ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {prediction.history.map(h => (
                    <div key={h.month} className="bg-gray-50 dark:bg-[#13151f] border border-gray-100 dark:border-gray-800 rounded-md px-3 py-3 text-sm">
                      <p className="text-gray-400 text-xs mb-1">{h.month}</p>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">₹{h.total.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-3 text-sm">
                    <p className="text-blue-400 text-xs mb-1">Next Month</p>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">₹{prediction.predicted_next_month.toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-blue-600 rounded-md px-4 py-3">
                  <p className="text-blue-100 text-xs mb-0.5">Prediction</p>
                  <p className="text-white font-semibold text-sm">{prediction.message}</p>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  )
}
