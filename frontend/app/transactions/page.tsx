'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import api from '@/services/api'

type Transaction = {
  id: number
  amount: string
  description: string
  category: string
  date: string
}

const emptyForm = { amount: '', description: '', category: 'other', date: '' }

export default function TransactionsPage() {
  const router = useRouter()
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

    fetchTransactions()
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
    setTimeout(() => setMessage(''), 4000)
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
      const e = err as { response?: { data?: Record<string, string[]> } }
      const data = e.response?.data
      if (data) {
        const first = Object.values(data)[0]
        showMessage(Array.isArray(first) ? first[0] : 'Failed to add transaction', true)
      } else {
        showMessage('Failed to add transaction', true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/transactions/${id}/`)
    setTransactions(prev => prev.filter(t => t.id !== id))
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
    } catch {
      showMessage('CSV upload failed', true)
    } finally {
      setUploading(false)
      setCsvFile(null)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Transactions</h1>

        {message && (
          <p className={`text-sm mb-4 px-4 py-2 rounded-lg ${isError ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {['food', 'transport', 'shopping', 'entertainment', 'health', 'utilities', 'other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={form.date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Transaction'}
              </button>
            </form>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Upload CSV</h2>
            <p className="text-gray-500 text-xs mb-3">CSV must have: amount, description, category, date</p>
            <input
              type="file"
              accept=".csv"
              onChange={e => setCsvFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-400 mb-3 w-full"
            />
            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || uploading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-4 text-sm font-medium disabled:opacity-50 w-full"
            >
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No transactions yet</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-400">{t.date}</td>
                    <td className="px-4 py-3 text-white">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">{t.category}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">₹{parseFloat(t.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 text-xs">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
