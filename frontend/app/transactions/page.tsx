'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

type Transaction = {
  id: number
  amount: string
  description: string
  category: string
  date: string
}

const emptyForm = { amount: '', description: '', category: 'other', date: '' }

const categoryStyle: Record<string, string> = {
  food: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  transport: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  shopping: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  entertainment: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  health: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  utilities: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export default function TransactionsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const fetchTransactions = async () => {
    const res = await api.get('/transactions/')
    setTransactions(res.data)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetchTransactions().catch(() => router.push('/login')).finally(() => setLoading(false))
  }, [router])

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
    setTimeout(() => setMessage(''), 4000)
  }

  const getDemoOrError = (err: unknown, fallback: string): string => {
    const e = err as { response?: { data?: { demo?: boolean; error?: string } & Record<string, string[]> } }
    const data = e.response?.data
    if (data?.demo) return data.error as string
    if (data) {
      const first = Object.values(data)[0]
      return Array.isArray(first) ? first[0] : fallback
    }
    return fallback
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/transactions/', form)
      setForm(emptyForm)
      showMessage('Transaction added successfully')
      await fetchTransactions()
    } catch (err: unknown) {
      showMessage(getDemoOrError(err, 'Failed to add transaction'), true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}/`)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err: unknown) {
      showMessage(getDemoOrError(err, 'Failed to delete transaction'), true)
    }
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', csvFile)
    try {
      const res = await api.post('/upload-csv/', formData)
      showMessage(res.data.message)
      await fetchTransactions()
    } catch (err: unknown) {
      showMessage(getDemoOrError(err, 'CSV upload failed'), true)
    } finally {
      setUploading(false)
      setCsvFile(null)
    }
  }

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

        <div className="p-4 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transactions</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage your income and expenses</p>
          </div>

          {message && (
            <div className={`mb-5 px-4 py-3 rounded-md border text-sm font-medium ${isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-5 lg:mb-6">
            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Transaction</h2>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {['other', 'food', 'transport', 'shopping', 'entertainment', 'health', 'utilities'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add Transaction'}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload CSV</h2>
              <p className="text-xs text-gray-400 mb-4">Supports standard CSV and bank statement format</p>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-md p-5 text-center mb-4">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-400 mb-3">{csvFile ? csvFile.name : 'Choose a CSV file to upload'}</p>
                <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-4 py-2 rounded-lg transition-colors">
                  Browse File
                  <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-40 w-full transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1d27] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">All Transactions</h2>
              <span className="text-xs text-gray-400">{transactions.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                    <th className="px-4 lg:px-6 py-3">Date</th>
                    <th className="px-4 lg:px-6 py-3">Description</th>
                    <th className="px-4 lg:px-6 py-3">Category</th>
                    <th className="px-4 lg:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 lg:px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No transactions yet</td></tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 lg:px-6 py-3 text-gray-400 text-xs whitespace-nowrap">{t.date}</td>
                        <td className="px-4 lg:px-6 py-3 text-gray-900 dark:text-gray-100 font-medium">{t.description}</td>
                        <td className="px-4 lg:px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${categoryStyle[t.category] ?? categoryStyle.other}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">₹{parseFloat(t.amount).toFixed(2)}</td>
                        <td className="px-4 lg:px-6 py-3 text-right">
                          <button onClick={() => handleDelete(t.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors">Delete</button>
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
