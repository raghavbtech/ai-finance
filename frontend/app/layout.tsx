import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'FinSight AI — AI-Powered Financial Trend Analysis',
  description: 'Machine learning driven financial analysis platform. Compare Linear Regression, Random Forest, and ANN models on your financial data.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5f4f0] dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
