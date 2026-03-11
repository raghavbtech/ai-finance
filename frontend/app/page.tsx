'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      router.push('/dashboard')
    } else {
      api.post('/login/', { username: 'demo', password: 'demo123' })
        .then(res => {
          localStorage.setItem('access_token', res.data.access)
router.push('/dashboard')
        })
        .catch(() => router.push('/login'))
    }
  }, [router])

  return null
}
