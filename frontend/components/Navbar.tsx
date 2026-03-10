'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

  const logout = () => {
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <span className="text-lg font-semibold text-white">AI Finance</span>
      <div className="flex gap-6 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        <Link href="/transactions" className="hover:text-white">Transactions</Link>
        <Link href="/ai-insights" className="hover:text-white">AI Insights</Link>
        <button onClick={logout} className="hover:text-red-400">Logout</button>
      </div>
    </nav>
  )
}
