'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer
} from 'recharts'
import Sidebar from '@/components/Sidebar'
import api from '@/services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6b7280']

const categoryStyle: Record<string, string> = {
  food: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  transport: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  shopping: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  entertainment: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  health: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  utilities: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  other: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

type Transaction = {
  id: number
  amount: string
  description: string
  category: string
  date: string
}

type Summary = {
  total_spending: number
  transaction_count: number
  top_category: string
  prediction: number
}

type BudgetAlert = {
  budget_set: boolean
  monthly_budget?: number
  percent_used?: number
  warning: string | null
}

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  color: '#111827',
  fontSize: '13px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
}

const shortMonth = (m: string) => {
  const [year, month] = m.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[parseInt(month) - 1]} ${year.slice(2)}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchBudgetAlert = () =>
    api.get('/budget-alert/').then(res => setBudgetAlert(res.data))

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }

    Promise.all([
      api.get('/transactions/'),
      api.get('/dashboard-summary/'),
      api.get('/budget-alert/'),
    ])
      .then(([txRes, sumRes, budgetRes]) => {
        setTransactions(txRes.data)
        setSummary(sumRes.data)
        setBudgetAlert(budgetRes.data)
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const [budgetError, setBudgetError] = useState('')

  const saveBudget = async () => {
    if (!budgetInput) return
    try {
      await api.post('/budget-alert/', { monthly_budget: budgetInput })
      setBudgetInput('')
      setBudgetError('')
      fetchBudgetAlert()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { demo?: boolean; error?: string } } }
      if (e.response?.data?.demo) {
        setBudgetError(e.response.data.error as string)
        setTimeout(() => setBudgetError(''), 4000)
      }
    }
  }

  const categoryData = transactions.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
    return acc
  }, {})
  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  const monthlyData = transactions.reduce((acc: Record<string, number>, t) => {
    const month = t.date.slice(0, 7)
    acc[month] = (acc[month] || 0) + parseFloat(t.amount)
    return acc
  }, {})
  const barData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month: shortMonth(month), total: parseFloat(total.toFixed(2)) }))

  const recent = [...transactions].slice(0, 5)

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-0.5">Your financial overview</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={budgetAlert?.budget_set ? `Budget: ₹${budgetAlert.monthly_budget}` : 'Set monthly budget'}
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d27] rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full sm:w-48"
              />
              <button
                onClick={saveBudget}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                {budgetAlert?.budget_set ? 'Update' : 'Set Budget'}
              </button>
            </div>
          </div>

          {budgetError && (
            <div className="mb-4 px-4 py-3 rounded-xl border text-sm font-medium bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400">
              {budgetError}
            </div>
          )}

          {budgetAlert?.warning && (
            <div className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium ${
              budgetAlert.percent_used && budgetAlert.percent_used >= 100
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
            }`}>
              {budgetAlert.warning}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-6">
            {[
              { label: 'This Month', value: `₹${summary?.total_spending.toFixed(0) ?? '—'}`, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Transactions', value: summary?.transaction_count ?? '—', color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Top Category', value: summary?.top_category ?? '—', color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Next Month Est.', value: `₹${summary?.prediction.toFixed(0) ?? '—'}`, color: 'text-blue-600 dark:text-blue-400' },
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{card.label}</p>
                <p className={`text-xl lg:text-2xl font-semibold truncate ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-4 lg:mb-5">
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Spending by Category</h2>
              <p className="text-xs text-gray-400 mb-4">Distribution across categories</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={42} paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Amount']} contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: '#6b7280', fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-sm mt-4">No data yet.</p>}
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 lg:p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Monthly Spending</h2>
              <p className="text-xs text-gray-400 mb-4">Total spend per month</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Total']} contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-sm mt-4">No data yet.</p>}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-50 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide text-left">
                    <th className="px-4 lg:px-6 py-3">Date</th>
                    <th className="px-4 lg:px-6 py-3">Description</th>
                    <th className="px-4 lg:px-6 py-3">Category</th>
                    <th className="px-4 lg:px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No transactions yet</td></tr>
                  ) : (
                    recent.map(t => (
                      <tr key={t.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 lg:px-6 py-3 text-gray-400 text-xs whitespace-nowrap">{t.date}</td>
                        <td className="px-4 lg:px-6 py-3 text-gray-900 dark:text-gray-100 font-medium">{t.description}</td>
                        <td className="px-4 lg:px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${categoryStyle[t.category] ?? categoryStyle.other}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">₹{parseFloat(t.amount).toFixed(2)}</td>
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
