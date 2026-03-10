'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer
} from 'recharts'
import Navbar from '@/components/Navbar'
import api from '@/services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6b7280']

type Transaction = {
  id: number
  amount: string
  description: string
  category: string
  date: string
}

const tooltipStyle = {
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
}

const shortMonth = (m: string) => {
  const [year, month] = m.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[parseInt(month) - 1]} ${year.slice(2)}`
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
  spent_this_month?: number
  percent_used?: number
  warning: string | null
}

export default function DashboardPage() {
  const router = useRouter()
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

  const saveBudget = async () => {
    if (!budgetInput) return
    await api.post('/budget-alert/', { monthly_budget: budgetInput })
    setBudgetInput('')
    fetchBudgetAlert()
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        {/* Budget Warning Banner */}
        {budgetAlert?.warning && (
          <div className={`mb-6 px-4 py-3 rounded-lg border text-sm font-medium ${
            budgetAlert.percent_used && budgetAlert.percent_used >= 100
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
            {budgetAlert.warning}
          </div>
        )}

        {/* Set Budget */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="number"
            placeholder={budgetAlert?.budget_set ? `Current budget: ₹${budgetAlert.monthly_budget}` : 'Set monthly budget (₹)'}
            value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
          />
          <button
            onClick={saveBudget}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            {budgetAlert?.budget_set ? 'Update Budget' : 'Set Budget'}
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">This Month</p>
            <p className="text-2xl font-bold text-white mt-2">₹{summary?.total_spending.toFixed(0) ?? '—'}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Transactions</p>
            <p className="text-2xl font-bold text-white mt-2">{summary?.transaction_count ?? '—'}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Top Category</p>
            <p className="text-2xl font-bold text-white mt-2">{summary?.top_category ?? '—'}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Next Month Est.</p>
            <p className="text-2xl font-bold text-blue-400 mt-2">₹{summary?.prediction.toFixed(0) ?? '—'}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-semibold mb-1">Spending by Category</h2>
            <p className="text-gray-500 text-xs mb-4">Distribution across categories</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Amount']}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm mt-4">No data yet. Add some transactions.</p>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-semibold mb-1">Monthly Spending</h2>
            <p className="text-gray-500 text-xs mb-4">Total spend per month</p>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Total']}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: '#374151' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm mt-4">No data yet. Add some transactions.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Recent Transactions</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide text-left">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-500">No transactions yet</td>
                </tr>
              ) : (
                recent.map(t => (
                  <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="px-5 py-3 text-gray-400">{t.date}</td>
                    <td className="px-5 py-3 text-white">{t.description}</td>
                    <td className="px-5 py-3">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-white">
                      ₹{parseFloat(t.amount).toFixed(2)}
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
