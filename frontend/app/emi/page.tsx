'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

type EMI = {
  id: number
  loan_name: string
  monthly_amount: string
  interest_rate: string
  remaining_months: number
  created_at: string
}

export default function EMIPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [emis, setEmis] = useState<EMI[]>([])
  const [form, setForm] = useState({ loan_name: '', monthly_amount: '', interest_rate: '0', remaining_months: '12' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchEMIs = async () => {
    const res = await api.get('/emis/')
    setEmis(res.data)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetchEMIs().catch(() => router.push('/login')).finally(() => setLoading(false))
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
      await api.post('/emis/', { ...form, remaining_months: parseInt(form.remaining_months) })
      setForm({ loan_name: '', monthly_amount: '', interest_rate: '0', remaining_months: '12' })
      showMessage('EMI added successfully')
      await fetchEMIs()
    } catch {
      showMessage('Failed to add EMI', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/emis/${id}/`)
      setEmis(prev => prev.filter(e => e.id !== id))
      showMessage('EMI deleted')
    } catch {
      showMessage('Failed to delete EMI', true)
    }
  }

  const totalEMI = emis.reduce((sum, e) => sum + parseFloat(e.monthly_amount), 0)
  const totalPayout = emis.reduce((sum, e) => sum + parseFloat(e.monthly_amount) * e.remaining_months, 0)

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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">EMI Management</h1>
            <p className="text-gray-400 text-sm mt-0.5">Track and manage your active loans</p>
          </div>

          {message && (
            <div className={`mb-5 px-4 py-3 rounded-md border text-sm font-medium ${isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'}`}>
              {message}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-red-500">
              <p className="text-xs text-gray-400 mb-1">Monthly EMI Burden</p>
              <p className="text-2xl font-bold text-red-500">₹{totalEMI.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-orange-400">
              <p className="text-xs text-gray-400 mb-1">Total Remaining Payout</p>
              <p className="text-2xl font-bold text-orange-500">₹{totalPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-gray-400">
              <p className="text-xs text-gray-400 mb-1">Active Loans</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{emis.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Add EMI form */}
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Add EMI</h2>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Loan name (e.g. Car Loan)"
                  value={form.loan_name}
                  onChange={e => setForm({ ...form, loan_name: e.target.value })}
                  className={inputCls}
                  required
                />
                <input
                  type="number"
                  placeholder="Monthly amount (₹)"
                  value={form.monthly_amount}
                  onChange={e => setForm({ ...form, monthly_amount: e.target.value })}
                  className={inputCls}
                  step="0.01"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Interest rate (%)"
                    value={form.interest_rate}
                    onChange={e => setForm({ ...form, interest_rate: e.target.value })}
                    className={inputCls}
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Remaining months"
                    value={form.remaining_months}
                    onChange={e => setForm({ ...form, remaining_months: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add EMI'}
                </button>
              </form>
            </div>

            {/* Info card */}
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">EMI Health</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Financial advisors recommend keeping total EMI below <span className="font-semibold text-gray-600 dark:text-gray-300">30–40% of monthly income</span>. Going above this reduces your ability to save and handle emergencies.
                </p>
              </div>
              {emis.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Earliest payoff</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {Math.min(...emis.map(e => e.remaining_months))} months remaining
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* EMI table */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Active Loans</h2>
              <span className="text-xs text-gray-400">{emis.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                    <th className="px-5 py-3">Loan</th>
                    <th className="px-5 py-3">Monthly</th>
                    <th className="px-5 py-3">Interest</th>
                    <th className="px-5 py-3">Remaining</th>
                    <th className="px-5 py-3">Total Left</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {emis.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No EMIs added yet</td></tr>
                  ) : (
                    emis.map(e => (
                      <tr key={e.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{e.loan_name}</td>
                        <td className="px-5 py-3.5 font-semibold text-red-500">₹{parseFloat(e.monthly_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{e.interest_rate}%</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{e.remaining_months} mo</td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                          ₹{(parseFloat(e.monthly_amount) * e.remaining_months).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => handleDelete(e.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors">
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
