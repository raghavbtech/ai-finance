'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

type Income = {
  id: number
  source: string
  amount: string
  date: string
  created_at: string
}

const sourceStyle: Record<string, string> = {
  salary: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  freelance: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  investment: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  bonus: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}


export default function IncomePage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [form, setForm] = useState({ source: 'salary', amount: '', date: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchIncomes = async () => {
    const res = await api.get('/incomes/')
    setIncomes(res.data)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetchIncomes().catch(() => router.push('/login')).finally(() => setLoading(false))
  }, [router])

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/incomes/', form)
      setForm({ source: 'salary', amount: '', date: '' })
      showMessage('Income added successfully')
      await fetchIncomes()
    } catch {
      showMessage('Failed to add income', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/incomes/${id}/`)
      setIncomes(prev => prev.filter(i => i.id !== id))
      showMessage('Income deleted')
    } catch {
      showMessage('Failed to delete income', true)
    }
  }

  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0)

  const bySource = incomes.reduce((acc: Record<string, number>, i) => {
    acc[i.source] = (acc[i.source] || 0) + parseFloat(i.amount)
    return acc
  }, {})

  const inputCls = 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 w-full'

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
        {/* Mobile header */}
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Income Tracking</h1>
            <p className="text-gray-400 text-sm mt-0.5">Record and monitor all your income sources</p>
          </div>

          {message && (
            <div className={`mb-5 px-4 py-3 rounded-md border text-sm font-medium ${isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'}`}>
              {message}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-emerald-500">
              <p className="text-xs text-gray-400 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-emerald-500">₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-blue-500">
              <p className="text-xs text-gray-400 mb-1">Income Entries</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{incomes.length}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-purple-500">
              <p className="text-xs text-gray-400 mb-1">Top Source</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 capitalize">
                {Object.keys(bySource).length > 0
                  ? Object.entries(bySource).sort(([, a], [, b]) => b - a)[0][0]
                  : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Add income form */}
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Income</h2>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <select
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  className={inputCls}
                >
                  {['salary', 'freelance', 'investment', 'bonus', 'other'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className={inputCls}
                  step="0.01"
                  required
                />
                <input
                  type="date"
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Income'}
                </button>
              </form>
            </div>

            {/* Breakdown by source */}
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">By Source</h2>
              {Object.keys(bySource).length === 0 ? (
                <p className="text-gray-400 text-sm">No income recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {Object.entries(bySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, amount]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${sourceStyle[source] ?? sourceStyle.other}`}>
                          {source}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Income history table */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Income History</h2>
              <span className="text-xs text-gray-400">{incomes.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[460px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No income entries yet</td></tr>
                  ) : (
                    incomes.map(i => (
                      <tr key={i.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{i.date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${sourceStyle[i.source] ?? sourceStyle.other}`}>
                            {i.source}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          +₹{parseFloat(i.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleDelete(i.id)}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
