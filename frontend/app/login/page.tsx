'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async (username: string, password: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/login/', { username, password })
      localStorage.setItem('access_token', res.data.access)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await api.post('/register/', form)
      }
      await doLogin(form.username, form.password)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Something went wrong')
      setLoading(false)
    }
  }

  const tryDemo = () => doLogin('demo', 'demo123')

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">FinSight AI</span>
        </div>

        {/* Demo callout */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">Try the demo</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mb-3">
            Explore all features with pre-loaded data — no sign up needed.
          </p>
          <button
            onClick={tryDemo}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Try Demo Account'}
          </button>
          <p className="text-center text-xs text-blue-400 dark:text-blue-500 mt-2">
            username: <span className="font-mono font-medium">demo</span> · password: <span className="font-mono font-medium">demo123</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1d27] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {isRegister ? 'Sign up to get started' : 'Sign in to your account'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151f] rounded-md px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-blue-600 hover:underline font-medium"
            >
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
