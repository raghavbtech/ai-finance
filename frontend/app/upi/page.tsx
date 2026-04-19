'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

type UPITransaction = {
  id: number
  receiver_upi_id: string
  amount: string
  description: string
  status: string
  transaction_type: string
  timestamp: string
}

type UPIRequest = {
  id: number
  requester_upi: string
  from_upi: string
  amount: string
  description: string
  status: string
  created_at: string
}

type Tab = 'send' | 'request'

export default function UPIPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('send')

  const [transactions, setTransactions] = useState<UPITransaction[]>([])
  const [incomingRequests, setIncomingRequests] = useState<UPIRequest[]>([])
  const [myRequests, setMyRequests] = useState<UPIRequest[]>([])
  const [upiId, setUpiId] = useState('')
  const [balance, setBalance] = useState(0)

  const [sendForm, setSendForm] = useState({ receiver_upi_id: '', amount: '', description: '' })
  const [requestForm, setRequestForm] = useState({ from_upi: '', amount: '', description: '' })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
    setTimeout(() => setMessage(''), 4000)
  }

  const fetchAll = async () => {
    const [txRes, profileRes, incomingRes, myReqRes] = await Promise.all([
      api.get('/upi/history/'),
      api.get('/upi/profile/'),
      api.get('/upi/requests/incoming/'),
      api.get('/upi/requests/mine/'),
    ])
    setTransactions(txRes.data)
    setUpiId(profileRes.data.upi_id)
    setBalance(profileRes.data.balance)
    setIncomingRequests(incomingRes.data)
    setMyRequests(myReqRes.data)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetchAll().catch(() => showMessage('Failed to load UPI data', true)).finally(() => setLoading(false))
  }, [router])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(sendForm.amount) > balance) {
      showMessage('Insufficient balance', true)
      return
    }
    setSubmitting(true)
    try {
      await api.post('/upi/send/', sendForm)
      setSendForm({ receiver_upi_id: '', amount: '', description: '' })
      showMessage('Money sent successfully')
      await fetchAll()
    } catch {
      showMessage('Failed to send money', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/upi/request/', requestForm)
      setRequestForm({ from_upi: '', amount: '', description: '' })
      showMessage('Payment request sent successfully')
      await fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      showMessage(msg || 'Failed to send request', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = async (id: number, action: 'accept' | 'reject') => {
    setResponding(id)
    try {
      const res = await api.post(`/upi/requests/${id}/respond/`, { action })
      showMessage(res.data.message)
      await fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      showMessage(msg || 'Failed to respond', true)
    } finally {
      setResponding(null)
    }
  }

  const sent = transactions.filter(t => t.transaction_type === 'sent').reduce((s, t) => s + parseFloat(t.amount), 0)
  const received = transactions.filter(t => t.transaction_type === 'received').reduce((s, t) => s + parseFloat(t.amount), 0)

  const inputCls = 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 w-full'

  const statusBadge = (s: string) => {
    if (s === 'pending') return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
    if (s === 'accepted') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
    return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">UPI Transfers</h1>
            <p className="text-gray-400 text-sm mt-0.5">Send money or request payment from another UPI ID</p>
          </div>

          {message && (
            <div className={`mb-5 px-4 py-3 rounded-md border text-sm font-medium ${isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'}`}>
              {message}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-blue-500">
              <p className="text-xs text-gray-400 mb-1">Your UPI ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{upiId}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-emerald-500">
              <p className="text-xs text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-emerald-500">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 rounded-lg p-5 border-l-4 border-l-purple-500">
              <p className="text-xs text-gray-400 mb-1">Total Sent / Received</p>
              <p className="text-sm font-semibold">
                <span className="text-red-500">−₹{sent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1.5">/</span>
                <span className="text-emerald-500">+₹{received.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Action form */}
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 shadow-sm rounded-lg p-5">
              <div className="flex gap-3 mb-5 border-b border-gray-100 dark:border-gray-800 pb-4">
                <button
                  onClick={() => setTab('send')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'send' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  Send Money
                </button>
                <button
                  onClick={() => setTab('request')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'request' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  Request Money
                </button>
              </div>

              {tab === 'send' ? (
                <form onSubmit={handleSend} className="flex flex-col gap-3">
                  <input type="text" placeholder="Receiver UPI ID (e.g. name@upi)" value={sendForm.receiver_upi_id}
                    onChange={e => setSendForm({ ...sendForm, receiver_upi_id: e.target.value })}
                    className={inputCls} required />
                  <input type="number" placeholder="Amount (₹)" value={sendForm.amount}
                    onChange={e => setSendForm({ ...sendForm, amount: e.target.value })}
                    className={inputCls} step="0.01" required />
                  <input type="text" placeholder="Description (optional)" value={sendForm.description}
                    onChange={e => setSendForm({ ...sendForm, description: e.target.value })}
                    className={inputCls} />
                  <button type="submit" disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors">
                    {submitting ? 'Sending...' : 'Send Money'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRequest} className="flex flex-col gap-3">
                  <input type="text" placeholder="Request from UPI ID (e.g. name@upi)" value={requestForm.from_upi}
                    onChange={e => setRequestForm({ ...requestForm, from_upi: e.target.value })}
                    className={inputCls} required />
                  <input type="number" placeholder="Amount (₹)" value={requestForm.amount}
                    onChange={e => setRequestForm({ ...requestForm, amount: e.target.value })}
                    className={inputCls} step="0.01" required />
                  <input type="text" placeholder="Description / reason (optional)" value={requestForm.description}
                    onChange={e => setRequestForm({ ...requestForm, description: e.target.value })}
                    className={inputCls} />
                  <button type="submit" disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors">
                    {submitting ? 'Sending Request...' : 'Send Request'}
                  </button>
                </form>
              )}
            </div>

            {/* Incoming payment requests */}
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 shadow-sm rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Incoming Requests</h2>
                {incomingRequests.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                    {incomingRequests.length} pending
                  </span>
                )}
              </div>

              {incomingRequests.length === 0 ? (
                <p className="text-gray-400 text-sm">No pending payment requests.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ₹{parseFloat(req.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">From: {req.requester_upi}</p>
                          {req.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{req.description}</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(req.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRespond(req.id, 'accept')}
                          disabled={responding === req.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          {responding === req.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'reject')}
                          disabled={responding === req.id}
                          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My sent requests */}
          {myRequests.length > 0 && (
            <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 shadow-sm rounded-lg overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">My Sent Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                      <th className="px-5 py-3">Requested From</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map(req => (
                      <tr key={req.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-700 dark:text-gray-300">{req.from_upi}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-gray-100">₹{parseFloat(req.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{req.description || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>
              <span className="text-xs text-gray-400">{transactions.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">UPI ID / Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No transactions yet</td></tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{new Date(t.timestamp).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.transaction_type === 'sent' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                            {t.transaction_type === 'sent' ? 'Sent' : 'Received'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{t.description || t.receiver_upi_id}</td>
                        <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${t.transaction_type === 'sent' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {t.transaction_type === 'sent' ? '−' : '+'}₹{parseFloat(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
